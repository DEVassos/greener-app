import { useEffect, useState } from 'react';
import { ApiError } from '../services/api';
import { fetchMonitoringSettings } from '../services/settings.service';
import type { MonitoringSettings } from '../services/settings.types';

interface MonitoringSettingsState {
  settings: MonitoringSettings | null;
  loading: boolean;
  error: string;
}

/** Parâmetros do monitoramento (área restrita). Um 401 encerra a sessão pelo api.ts. */
export function useMonitoringSettings(): MonitoringSettingsState {
  const [state, setState] = useState<MonitoringSettingsState>({ settings: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();

    fetchMonitoringSettings(controller.signal)
      .then((settings) => setState({ settings, loading: false, error: '' }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return; // a tela foi fechada: ninguém espera a resposta
        const error = reason instanceof ApiError ? reason.message : 'Não foi possível carregar a configuração.';
        setState({ settings: null, loading: false, error });
      });

    return () => controller.abort();
  }, []);

  return state;
}
