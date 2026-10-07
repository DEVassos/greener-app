import type { ServicesSummary } from '../utils/summary';
import { formatNumber } from '../utils/format';
import MetricTile from './MetricTile';
import './KpiPanel.css';

interface Props {
  summary: ServicesSummary;
  /** Período dos totais, como a API devolve (ex.: "última 1 hora"). */
  period: string;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Indicadores consolidados de nível 1 (RF08, RF09). */
export default function KpiPanel({ summary, period }: Props) {
  const intensity =
    summary.averageIntensity === null ? undefined : `média de ${formatNumber(summary.averageIntensity, 0)} g CO₂e/kWh`;

  return (
    <section className="kpis" aria-label="Indicadores consolidados">
      <MetricTile
        label="Energia total"
        value={formatNumber(summary.totalEnergyKwh, 3)}
        unit="kWh"
        note={`na ${period}`}
        icon={
          <svg {...iconProps}>
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
          </svg>
        }
      />
      <MetricTile
        label="Emissão total"
        value={formatNumber(summary.totalEmissionsG, 1)}
        unit="g CO₂e"
        note={intensity ?? `na ${period}`}
        icon={
          <svg {...iconProps}>
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
        }
      />
      <MetricTile
        label="Serviços ativos"
        value={String(summary.active)}
        tone="success"
        icon={
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        }
      />
      <MetricTile
        label="Indisponíveis"
        value={String(summary.unavailable)}
        tone="danger"
        icon={
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        }
      />
      <MetricTile
        label="Sem métricas"
        value={String(summary.withoutMetrics)}
        tone="warning"
        icon={
          <svg {...iconProps}>
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        }
      />
    </section>
  );
}
