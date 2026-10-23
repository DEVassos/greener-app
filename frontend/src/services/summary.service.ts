import { apiRequest } from './api';
import { demoSummary } from './demo-data';
import { isDemoMode } from './services.service';
import type { SummaryResponse } from './summary.types';

/** Indicadores agregados de todos os serviços no período [from, to) (datas ISO 8601 com hora). */
export async function fetchSummary(from: string, to: string, signal?: AbortSignal): Promise<SummaryResponse> {
  if (isDemoMode) return demoSummary(from, to);
  const query = new URLSearchParams({ from, to });
  return apiRequest<SummaryResponse>(`/services/summary?${query}`, { signal });
}
