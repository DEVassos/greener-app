import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/api';
import { fetchServices } from '../services/services.service';
import type { ServicesResponse } from '../services/services.types';

export interface ServicesState {
  data: ServicesResponse | null;
  loading: boolean;
  /** Mensagem pronta para a tela; vazia quando a última busca deu certo. */
  error: string;
  /** Horário da última busca bem-sucedida (ISO 8601); null antes da primeira. */
  updatedAt: string | null;
  /** Busca de novo (botão "Tentar novamente"). */
  reload: () => void;
}

/** Busca a lista de serviços monitorados ao abrir a tela. */
export function useServices(): ServicesState {
  const [data, setData] = useState<ServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchServices(controller.signal)
      .then((response) => {
        setData(response);
        setUpdatedAt(new Date().toISOString());
        setError('');
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return; // a tela foi fechada: ninguém espera a resposta
        // Mantém o último dado recebido; a tela mostra o erro junto
        setError(reason instanceof ApiError ? reason.message : 'Não foi possível carregar os serviços.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  return { data, loading, error, updatedAt, reload };
}
