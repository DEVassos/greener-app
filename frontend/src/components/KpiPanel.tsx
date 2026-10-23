import type { StatusSummary } from '../utils/summary';
import MetricTile from './MetricTile';
import './KpiPanel.css';

interface Props {
  summary: StatusSummary;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Cards de nível 1 com o estado dos serviços (RF08, RF09). Energia e CO₂e do período ficam no painel de indicadores agregados. */
export default function KpiPanel({ summary }: Props) {
  const base = `de ${summary.monitored} monitorados`;
  const removedNote =
    summary.removed === 0
      ? 'descobertos no agregador'
      : summary.removed === 1
        ? 'sem contar 1 removido'
        : `sem contar ${summary.removed} removidos`;

  return (
    <section className="kpis" aria-label="Estado dos serviços monitorados">
      <MetricTile
        label="Serviços monitorados"
        value={String(summary.monitored)}
        note={removedNote}
        icon={
          <svg {...iconProps}>
            <rect x="3" y="4" width="18" height="7" rx="2" />
            <rect x="3" y="13" width="18" height="7" rx="2" />
            <path d="M7 7.5h.01M7 16.5h.01" />
          </svg>
        }
      />
      <MetricTile
        label="Ativos"
        value={String(summary.active)}
        note={base}
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
        note={base}
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
        note={base}
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
