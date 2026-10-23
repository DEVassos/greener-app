// Funções puras da página Emissões: soma em intervalos, totais, datas do filtro, resumo e formatação.

import type { EmissionPoint, EmissionsBucket, EmissionsTotals } from '../services/emissions.types';

/** Soma de números que podem faltar: null só quando todos faltam (sem cálculo não vira zero). */
function addNullable(sum: number | null, value: number | null): number | null {
  if (value === null) return sum;
  return (sum ?? 0) + value;
}

/** Totais do período a partir dos pontos (mesmas regras de `totals` da #189). */
export function totalsOf(points: EmissionPoint[], carbonIntensity: number | null): EmissionsTotals {
  const totals: EmissionsTotals = {
    collections: 0,
    failed: 0,
    notCalculated: 0,
    energyKwh: null,
    co2eGrams: null,
    co2eMaxGrams: null,
    carbonIntensity,
  };
  for (const point of points) {
    totals.collections += point.collections;
    totals.failed += point.failed;
    totals.notCalculated += point.notCalculated;
    totals.energyKwh = addNullable(totals.energyKwh, point.energyKwh);
    totals.co2eGrams = addNullable(totals.co2eGrams, point.co2eGrams);
    if (point.co2eMaxGrams !== null && (totals.co2eMaxGrams === null || point.co2eMaxGrams > totals.co2eMaxGrams)) {
      totals.co2eMaxGrams = point.co2eMaxGrams;
    }
  }
  return totals;
}

/**
 * Junta coletas (pontos de uma coleta só) em intervalos de `bucketMs` alinhados a `originMs`, como o `date_bin` da
 * #189. Intervalos sem nenhuma coleta não aparecem: o gráfico mostra o buraco.
 */
export function groupPoints(points: EmissionPoint[], bucketMs: number, originMs: number): EmissionPoint[] {
  const groups = new Map<number, EmissionPoint>();
  for (const point of points) {
    const start = originMs + Math.floor((point.t - originMs) / bucketMs) * bucketMs;
    const group = groups.get(start);
    if (!group) {
      groups.set(start, { ...point, t: start });
      continue;
    }
    group.collections += point.collections;
    group.failed += point.failed;
    group.notCalculated += point.notCalculated;
    group.energyKwh = addNullable(group.energyKwh, point.energyKwh);
    group.co2eGrams = addNullable(group.co2eGrams, point.co2eGrams);
    if (point.co2eMinGrams !== null && (group.co2eMinGrams === null || point.co2eMinGrams < group.co2eMinGrams)) {
      group.co2eMinGrams = point.co2eMinGrams;
    }
    if (point.co2eMaxGrams !== null && (group.co2eMaxGrams === null || point.co2eMaxGrams > group.co2eMaxGrams)) {
      group.co2eMaxGrams = point.co2eMaxGrams;
    }
  }
  return [...groups.values()].sort((a, b) => a.t - b.t);
}

// ── Datas do filtro (yyyy-mm-dd, horário local) ────────────────────────────

const DAY_MS = 86_400_000;

/** Data local de hoje como "yyyy-mm-dd" (valor do <input type="date">). */
export function todayInput(): string {
  return toInputDate(new Date());
}

export function toInputDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-mm-dd" válida? (o filtro vem da URL e pode chegar digitado à mão) */
export function isInputDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && toInputDate(parseInputDate(value)) === value;
}

/** "yyyy-mm-dd" → meia-noite local daquele dia. */
export function parseInputDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Soma dias a uma data "yyyy-mm-dd" (pode ser negativo). */
export function shiftInputDate(value: string, days: number): string {
  const date = parseInputDate(value);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

/** Dias do período, contando os dois extremos (15/10 a 15/10 = 1). */
export function spanDays(start: string, end: string): number {
  return Math.round((parseInputDate(end).getTime() - parseInputDate(start).getTime()) / DAY_MS) + 1;
}

/** Período do filtro em milissegundos: do início do dia inicial até o fim do dia final, ou agora, se for antes. */
export function periodMs(start: string, end: string): { fromMs: number; toMs: number } {
  const fromMs = parseInputDate(start).getTime();
  const toMs = Math.min(parseInputDate(shiftInputDate(end, 1)).getTime(), Date.now());
  return { fromMs, toMs: Math.max(toMs, fromMs + 1) };
}

/** "2026-10-15" → "15/10/2026". */
export function formatInputDate(value: string): string {
  return parseInputDate(value).toLocaleDateString('pt-BR');
}

// ── Agrupamento ─────────────────────────────────────────────────────────────

export const BUCKET_MS: Record<EmissionsBucket, number> = { coleta: 30_000, '15min': 15 * 60_000, '1h': 60 * 60_000 };

export const BUCKET_LABEL: Record<EmissionsBucket, string> = { coleta: 'Cada coleta', '15min': '15 min', '1h': '1 hora' };

/** Agrupamento automático pelo tamanho do período: até 2 h, cada coleta; até 1 dia, 15 min; mais que isso, 1 h. */
export function autoBucket(fromMs: number, toMs: number): EmissionsBucket {
  const span = toMs - fromMs;
  if (span <= 2 * 60 * 60_000) return 'coleta';
  return span <= DAY_MS ? '15min' : '1h';
}

// ── Resumo do período ───────────────────────────────────────────────────────

export interface EmissionsSummary {
  /** Coletas com emissão calculada. */
  calculated: number;
  /** Emissão média de uma coleta calculada, em g CO₂e. */
  meanGrams: number | null;
  /** Ponto (coleta ou intervalo) onde aconteceu a maior emissão de uma coleta. */
  peak: EmissionPoint | null;
}

export function summarize(points: EmissionPoint[], totals: EmissionsTotals): EmissionsSummary {
  const calculated = Math.max(0, totals.collections - totals.failed - totals.notCalculated);
  let peak: EmissionPoint | null = null;
  for (const point of points) {
    if (point.co2eMaxGrams !== null && (peak === null || point.co2eMaxGrams > (peak.co2eMaxGrams ?? 0))) peak = point;
  }
  return {
    calculated,
    meanGrams: totals.co2eGrams !== null && calculated > 0 ? totals.co2eGrams / calculated : null,
    peak,
  };
}

/**
 * Tempo sem coleta no período. Agrupado: intervalos que não vieram. Por coleta: o que passou do intervalo típico
 * nos trechos parados por mais de 3× esse intervalo. É ausência de registro, não indisponibilidade.
 */
export function missingTimeMs(points: EmissionPoint[], bucket: EmissionsBucket, fromMs: number, toMs: number): number {
  // Sem nenhuma coleta a tela já diz "Nenhuma coleta no período"
  if (points.length === 0) return 0;
  if (bucket !== 'coleta') {
    const expected = Math.ceil((toMs - fromMs) / BUCKET_MS[bucket]);
    return Math.max(0, expected - points.length) * BUCKET_MS[bucket];
  }
  const deltas = points.slice(1).map((point, i) => point.t - points[i].t);
  if (deltas.length === 0) return 0;
  const typical = [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length / 2)];
  return deltas.reduce((missing, delta) => (delta > typical * 3 ? missing + delta - typical : missing), 0);
}

/** Quantas vezes o pico ficou acima da média; null sem cálculo. */
export function peakRatio(summary: EmissionsSummary): number | null {
  const peak = summary.peak?.co2eMaxGrams;
  if (peak == null || summary.meanGrams === null || summary.meanGrams <= 0) return null;
  return peak / summary.meanGrams;
}

/** Quando foi o pico: o horário da coleta, ou o intervalo em que ela caiu. */
export function formatPeakTime(point: EmissionPoint, bucket: EmissionsBucket): string {
  if (bucket === 'coleta') return formatPointTime(point.t);
  const end = new Date(point.t + BUCKET_MS[bucket]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${formatPointTime(point.t, false)}–${end}`;
}

/**
 * Leitura do período em frases curtas, para quem precisa decidir sem interpretar o gráfico:
 * quando foi o pico e quanto ele se afasta da média, e quanto tempo ficou sem coleta.
 */
export function describePeriod(summary: EmissionsSummary, bucket: EmissionsBucket, missingMs: number): string[] {
  const lines: string[] = [];
  const ratio = peakRatio(summary);
  const peak = summary.peak?.co2eMaxGrams;
  if (summary.peak && peak != null && ratio !== null) {
    const when = formatPeakTime(summary.peak, bucket);
    lines.push(
      ratio >= 1.5
        ? `Pico de ${formatGrams(peak)} CO₂e numa coleta em ${when}, ${formatRatio(ratio)} a média do período. Vale ver o que rodou nesse horário.`
        : `Emissão estável: o pico (${formatGrams(peak)} em ${when}) ficou perto da média.`,
    );
  }
  if (missingMs > 0) {
    lines.push(`${formatDuration(missingMs)} sem coleta no período: esses trechos não entram no total.`);
  }
  return lines;
}

// ── Formatação ──────────────────────────────────────────────────────────────

function withUnit(value: number, unit: string): string {
  return `${value.toLocaleString('pt-BR', { maximumSignificantDigits: 3, minimumSignificantDigits: 1 })} ${unit}`;
}

/** Gramas de CO₂e com unidade adequada: mg abaixo de 1 g, kg a partir de 1 000 g, t a partir de 1 000 kg. */
export function formatGrams(grams: number): string {
  if (grams === 0) return '0 g';
  if (grams < 1) return withUnit(grams * 1000, 'mg');
  if (grams < 1000) return withUnit(grams, 'g');
  if (grams < 1_000_000) return withUnit(grams / 1000, 'kg');
  return withUnit(grams / 1_000_000, 't');
}

/** kWh com unidade adequada (Wh abaixo de 1 kWh). */
export function formatKwh(kwh: number): string {
  if (kwh === 0) return '0 kWh';
  return kwh < 1 ? withUnit(kwh * 1000, 'Wh') : withUnit(kwh, 'kWh');
}

/** Número curto, sem unidade (eixo do gráfico, intensidade). */
export function formatShort(value: number): string {
  return value.toLocaleString('pt-BR', { maximumSignificantDigits: 3 });
}

/** 2.14 → "2,1×". */
export function formatRatio(ratio: number): string {
  return `${ratio.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`;
}

/** Duração curta: "45 min", "1 h 30 min", "2 d 4 h". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60_000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

/** "15/10 14:32:05" (ou "15/10 14:32", sem os segundos). */
export function formatPointTime(t: number, seconds = true): string {
  const date = new Date(t);
  const time = date.toLocaleTimeString('pt-BR', seconds ? undefined : { hour: '2-digit', minute: '2-digit' });
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`;
}
