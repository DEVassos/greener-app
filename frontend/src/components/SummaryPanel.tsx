import type { ServicesSummaryResponse } from '../services/services.types';
import MetricTile from './MetricTile';
import './KpiPanel.css';

interface Props {
  summary: ServicesSummaryResponse;
  previousSummary: ServicesSummaryResponse | null;
  comparisonLoading: boolean;
  stale: boolean;
}

function variation(current: number | null, previous: number | null, hasPreviousPeriod: boolean, loading: boolean): string {
  if (loading) return 'Comparando período anterior…';
  if (current === null) return 'Sem cálculo disponível neste período';
  if (!hasPreviousPeriod) return 'Comparação indisponível';
  if (previous === null) return 'Sem cálculo no período anterior';
  if (previous === 0) return 'Sem base para comparação';
  const percent = ((current - previous) / previous) * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% vs. período anterior`;
}

export default function SummaryPanel({ summary, previousSummary, comparisonLoading, stale }: Props) {
  const period = `${new Date(summary.period.from).toLocaleString('pt-BR')} até ${new Date(summary.period.to).toLocaleString('pt-BR')}`;
  const energyChange = variation(summary.energyKwh, previousSummary?.energyKwh ?? null, previousSummary !== null, comparisonLoading);
  const emissionsChange = variation(summary.co2eGrams, previousSummary?.co2eGrams ?? null, previousSummary !== null, comparisonLoading);
  return <section className="kpis" aria-label="Indicadores agregados do período">
    <MetricTile label="Energia no período" value={summary.energyKwh === null ? '—' : summary.energyKwh.toFixed(4)} unit={summary.energyKwh === null ? undefined : 'kWh'} note={`${energyChange} · ${period}`} stale={stale} icon={<span>⚡</span>} />
    <MetricTile label="Emissões no período" value={summary.co2eGrams === null ? '—' : summary.co2eGrams.toFixed(2)} unit={summary.co2eGrams === null ? undefined : 'g CO₂e'} note={emissionsChange} stale={stale} icon={<span>◌</span>} />
    <MetricTile label="Serviços ativos" value={String(summary.services.active)} stale={stale} tone="success" icon={<span>✓</span>} />
    <MetricTile label="Indisponíveis" value={String(summary.services.unavailable)} stale={stale} tone="danger" icon={<span>!</span>} />
    <MetricTile label="Sem métricas" value={String(summary.services.withoutMetrics)} stale={stale} tone="warning" icon={<span>…</span>} />
    <MetricTile label="Removidos" value={String(summary.services.removed)} stale={stale} icon={<span>−</span>} />
  </section>;
}
