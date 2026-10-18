import { apiRequest } from './api';
import type { CollectionsResponse } from './collections.types';
import { demoCollections } from './demo-data';
import { isDemoMode } from './services.service';

/** Quantas coletas a janela de detalhes mostra (padrão da API; máximo 500). */
export const HISTORY_LIMIT = 100;

/** Histórico de coletas de um serviço, da mais recente para a mais antiga. */
export async function fetchServiceCollections(serviceId: string, signal?: AbortSignal): Promise<CollectionsResponse> {
  if (isDemoMode) return demoCollections(serviceId, HISTORY_LIMIT);
  const query = new URLSearchParams({ service_id: serviceId, limit: String(HISTORY_LIMIT) });
  return apiRequest<CollectionsResponse>(`/collections?${query}`, { signal });
}
