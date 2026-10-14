import type { ReactNode } from 'react';
import { formatDayTime } from '../utils/format';
import './LastUpdated.css';

interface Props {
  /** Horário da última busca bem-sucedida (ISO 8601); null antes da primeira. */
  updatedAt: string | null;
  /** Intervalo da atualização automática, em segundos (omitido quando não há). */
  intervalSeconds?: number;
  /** A última tentativa falhou: o dado na tela é o da atualização anterior. */
  stale?: boolean;
  /** Ações ao lado do texto (ex.: botão de atualizar agora). */
  children?: ReactNode;
}

/** Selo "tempo real": ponto pulsando enquanto os dados estão em dia, laranja quando desatualizados. */
export default function LastUpdated({ updatedAt, intervalSeconds, stale = false, children }: Props) {
  if (!updatedAt) return null;

  return (
    <div className={stale ? 'last-updated last-updated--stale' : 'last-updated'} role="status">
      <span className="live-dot" aria-hidden="true" />
      <span>
        {stale ? 'Desatualizado desde ' : 'Última atualização: '}
        <strong>{formatDayTime(updatedAt)}</strong>
        {intervalSeconds !== undefined && ` · intervalo: ${intervalSeconds} s`}
      </span>
      {children}
    </div>
  );
}
