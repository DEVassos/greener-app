import type { SummaryResponse, SummaryTotals } from '../services/summary.types';
import { formatDayTime, formatNumber } from '../utils/format';
import { formatBrasiliaDay, formatBrasiliaTime, formatCo2e, formatEnergy, formatVariation, variationPercent } from '../utils/indicators';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import MetricTile from './MetricTile';
import MissingValue from './MissingValue';
import './KpiPanel.css';

interface Props {
  data: SummaryResponse | null;
  loading: boolean;
  /** Mensagem da última busca que falhou; vazia quando está em dia. */
  error: string;
  /** Horário da última busca bem-sucedida: vira "desatualizado desde" quando há erro. */
  updatedAt: string | null;
  onRetry: () => void;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Nota de variação: só aparece quando o período anterior tem valor para comparar. */
function variationNote(current: number | null, previous: number | null): string | undefined {
  const percent = variationPercent(current, previous);
  return percent === null ? undefined : formatVariation(percent, 'ontem');
}

const notCalculated = <MissingValue label="não calculado" title="Nenhuma coleta com cálculo de energia e CO₂e no período" />;

function collectionsNote(totals: SummaryTotals): string | undefined {
  const parts = [];
  if (totals.failed > 0) parts.push(`${formatNumber(totals.failed, 0)} com falha`);
  if (totals.notCalculated > 0) parts.push(`${formatNumber(totals.notCalculated, 0)} sem cálculo`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** Painel de indicadores agregados de hoje (RF08): energia, CO₂e, intensidade e coletas, com a variação vs. ontem. */
export default function IndicatorsPanel({ data, loading, error, updatedAt, onRetry }: Props) {
  const stale = error !== '' && data !== null;
  const totals = data?.totals;
  const previous = data?.previous.totals;
  const energy = totals?.energyKwh != null ? formatEnergy(totals.energyKwh) : null;
  const co2e = totals?.co2eGrams != null ? formatCo2e(totals.co2eGrams) : null;

  return (
    <section className="rounded-xl border border-border bg-surface" aria-labelledby="indicators-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border px-5 py-4">
        <h2 id="indicators-title" className="m-0 font-display text-lg font-semibold">
          Indicadores de hoje
        </h2>
        {/* Período sempre na tela, com o fuso: os números valem para esta janela, não para "o tempo todo" */}
        {data && (
          <p className="m-0 text-sm text-muted">
            {formatBrasiliaDay(data.from)}, {formatBrasiliaTime(data.from)} às {formatBrasiliaTime(data.to)} (horário de Brasília) · comparado com
            ontem no mesmo horário
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {error && <ErrorState message={error} onRetry={onRetry} />}

        {loading && !data && <LoadingState message="Carregando indicadores…" />}

        {data && totals && totals.collections === 0 && (
          <EmptyState
            title="Nenhuma coleta hoje ainda"
            description="Os indicadores aparecem depois da primeira coleta do dia, contada a partir da meia-noite de Brasília."
          />
        )}

        {data && totals && previous && totals.collections > 0 && (
          <div
            className="kpis"
            title={stale && updatedAt ? `Dados de ${formatDayTime(updatedAt)}: a última atualização falhou` : undefined}
          >
            <MetricTile
              label="Energia estimada"
              value={energy ? energy.value : notCalculated}
              unit={energy?.unit}
              note={variationNote(totals.energyKwh, previous.energyKwh)}
              stale={stale}
              icon={
                <svg {...iconProps}>
                  <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
                </svg>
              }
            />
            <MetricTile
              label="Emissão estimada"
              value={co2e ? co2e.value : notCalculated}
              unit={co2e?.unit}
              note={variationNote(totals.co2eGrams, previous.co2eGrams)}
              stale={stale}
              icon={
                <svg {...iconProps}>
                  <path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12 3.5 3.5 0 0 0 6 19Z" />
                </svg>
              }
            />
            <MetricTile
              label="Intensidade média"
              value={totals.carbonIntensityGco2ePerKwh != null ? formatNumber(totals.carbonIntensityGco2ePerKwh, 0) : notCalculated}
              unit={totals.carbonIntensityGco2ePerKwh != null ? 'g/kWh' : undefined}
              note={totals.carbonIntensityGco2ePerKwh != null ? 'das coletas calculadas' : undefined}
              stale={stale}
              icon={
                <svg {...iconProps}>
                  <path d="M12 3a9 9 0 1 0 9 9" />
                  <path d="M12 12 18 6" />
                  <path d="M16 3h5v5" />
                </svg>
              }
            />
            <MetricTile
              label="Coletas"
              value={formatNumber(totals.collections, 0)}
              note={collectionsNote(totals)}
              tone={totals.failed > 0 ? 'warning' : 'neutral'}
              stale={stale}
              icon={
                <svg {...iconProps}>
                  <path d="M3 3v18h18" />
                  <path d="m7 15 4-4 3 3 5-6" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
