import type { ServicesSummaryResponse } from '../services/services.types';
import MetricTile from './MetricTile';
import './KpiPanel.css';

interface Props { summary: ServicesSummaryResponse; stale: boolean }

export default function SummaryPanel({ summary, stale }: Props) {
  const period = `${new Date(summary.period.from).toLocaleString('pt-BR')} até ${new Date(summary.period.to).toLocaleString('pt-BR')}`;
  return <section className="kpis" aria-label="Indicadores agregados do período">
    <MetricTile label="Energia no período" value={summary.energyKwh.toFixed(4)} unit="kWh" note={period} stale={stale} icon={<span>⚡</span>} />
    <MetricTile label="Emissões no período" value={summary.co2eGrams.toFixed(2)} unit="g CO₂e" stale={stale} icon={<span>◌</span>} />
    <MetricTile label="Serviços ativos" value={String(summary.services.active)} stale={stale} tone="success" icon={<span>✓</span>} />
    <MetricTile label="Indisponíveis" value={String(summary.services.unavailable)} stale={stale} tone="danger" icon={<span>!</span>} />
  </section>;
}
