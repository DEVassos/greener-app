import { apiRequest } from './api';
import type { MonitoringSettings } from './settings.types';

/** Rota privada: o api.ts envia o token da sessão em Authorization: Bearer. */
export function fetchMonitoringSettings(signal?: AbortSignal): Promise<MonitoringSettings> {
  return apiRequest<MonitoringSettings>('/monitoring-settings', { signal });
}
