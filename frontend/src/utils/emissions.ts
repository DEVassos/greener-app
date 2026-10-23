// Funções puras da página Emissões: soma das coletas em intervalos e totais do período.

import type { EmissionPoint, EmissionsTotals } from '../services/emissions.types';

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
