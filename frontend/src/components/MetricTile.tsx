import type { ReactNode } from 'react';
import './MetricTile.css';

/** Cor do card: ativo, indisponível e sem métricas seguem o StatusBadge; neutral é para totais. */
export type MetricTone = 'neutral' | 'success' | 'danger' | 'warning';

interface Props {
  label: string;
  value: string;
  unit?: string;
  /** Linha de apoio abaixo do valor (período, base da contagem). */
  note?: string;
  icon: ReactNode;
  tone?: MetricTone;
}

/** Card de indicador de nível 1. O que ele mede está sempre no rótulo: a cor nunca é a única pista. */
export default function MetricTile({ label, value, unit, note, icon, tone = 'neutral' }: Props) {
  return (
    <div className={`metric metric--${tone}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="metric-value">
        {value} {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {note && <div className="metric-note">{note}</div>}
    </div>
  );
}
