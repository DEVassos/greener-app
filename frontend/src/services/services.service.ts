import { apiRequest } from './api';
import { demoServices } from './demo-data';
import type { ServicesResponse, ServicesSummaryResponse } from './services.types';

/** Sem VITE_API_URL o frontend roda em modo demonstração, com os dados do protótipo. */
export const isDemoMode = !import.meta.env.VITE_API_URL;

export async function fetchServices(signal?: AbortSignal): Promise<ServicesResponse> {
  if (isDemoMode) return demoServices();
  return apiRequest<ServicesResponse>('/services', { signal });
}
export async function fetchServicesSummary(from: string, to: string, signal?: AbortSignal): Promise<ServicesSummaryResponse> {
  return apiRequest<ServicesSummaryResponse>(`/services/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { signal });
}
