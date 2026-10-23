import { useCallback, useState } from 'react';
import { ApiError } from '../services/api';
import { fetchSummary } from '../services/summary.service';
import type { SummaryResponse } from '../services/summary.types';
import { todayPeriod } from '../utils/indicators';
import { useMonitoring } from './useMonitoring';
import { usePolling } from './usePolling';

export interface SummaryState {
  data: SummaryResponse | null;
  /** Há uma busca em andamento (a primeira ou uma atualização). */
  loading: boolean;
  /** Mensagem pronta para a tela; vazia quando a última busca deu certo. */
  error: string;
  /** Horário da última busca bem-sucedida (ISO 8601); null antes da primeira. */
  updatedAt: string | null;
  refresh: () => void;
}

/** Indicadores agregados de hoje (00:00 de Brasília até agora), atualizados no intervalo do MonitoringProvider. */
export function useSummary(): SummaryState {
  const { refreshIntervalMs } = useMonitoring();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      // O fim do período é "agora" a cada ciclo; depois da meia-noite o painel passa sozinho para o dia novo
      const { from, to } = todayPeriod();
      const response = await fetchSummary(from, to, signal);
      setData(response);
      setUpdatedAt(new Date().toISOString());
      setError('');
    } catch (reason) {
      if (signal.aborted) return;
      // Mantém o último dado recebido; o painel mostra o erro e marca os números como desatualizados
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível carregar os indicadores.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const { refresh } = usePolling(load, refreshIntervalMs);

  return { data, loading, error, updatedAt, refresh };
}
