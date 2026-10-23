// Período e formatação do painel de indicadores agregados (RF08).

import { formatNumber } from './format';

/** Fuso do período: o dia do painel começa à meia-noite de Brasília (sem horário de verão desde 2019). */
const TIME_ZONE = 'America/Sao_Paulo';
const UTC_OFFSET = '-03:00';

/** Hoje em Brasília, das 00:00 até agora, em ISO 8601 UTC. `to` fica sempre depois de `from` (a API recusa igual). */
export function todayPeriod(now: Date = new Date()): { from: string; to: string } {
  // en-CA formata como AAAA-MM-DD
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const start = Date.parse(`${day}T00:00:00${UTC_OFFSET}`);
  return { from: new Date(start).toISOString(), to: new Date(Math.max(now.getTime(), start + 1000)).toISOString() };
}

/** ISO 8601 → "15:42" no horário de Brasília. */
export function formatBrasiliaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
}

/** ISO 8601 → "23/10" no horário de Brasília. */
export function formatBrasiliaDay(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit' });
}

/** Variação percentual em relação ao período anterior; null sem base (valor ausente ou anterior zero). */
export function variationPercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** 4,2 → "+4% vs. ontem"; arredondada a zero → "igual a ontem". O sinal vai no texto: a cor nunca é a única pista. */
export function formatVariation(percent: number, label: string): string {
  const rounded = Math.round(percent);
  if (rounded === 0) return `igual a ${label}`;
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}% vs. ${label}`;
}

/** Energia com a unidade que deixa o número legível: 1,07 kWh ou 2,8 Wh. */
export function formatEnergy(kwh: number): { value: string; unit: string } {
  if (kwh >= 1) return { value: formatNumber(kwh, 2), unit: 'kWh' };
  return { value: formatNumber(kwh * 1000, 1), unit: 'Wh' };
}

/** Massa de CO₂e: 1,25 kg, 403,5 g ou 235 mg. */
export function formatCo2e(grams: number): { value: string; unit: string } {
  if (grams >= 1000) return { value: formatNumber(grams / 1000, 2), unit: 'kg CO₂e' };
  if (grams >= 1) return { value: formatNumber(grams, 1), unit: 'g CO₂e' };
  return { value: formatNumber(grams * 1000, 0), unit: 'mg CO₂e' };
}
