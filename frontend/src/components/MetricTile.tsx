import type { ReactNode } from 'react';
import './MetricTile.css';

/** Cor semântica do card: verde ativo, vermelho indisponível, laranja sem métricas. */
export type MetricTone = 'neutral' | 'success' | 'danger' | 'warning';

interface Props {
  label: string;
  value: string;
  unit?: string;
  /** Linha de apoio abaixo do valor (período, média). */
  note?: string;
  icon: ReactNode;
  tone?: MetricTone;
}

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
