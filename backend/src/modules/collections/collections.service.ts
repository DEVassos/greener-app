import { NotFoundError } from '../../shared/errors';
import { ServiceRepository } from '../services/services.repository';
import { CollectionRepository, type CollectionFilters, type CollectionListRow } from './collections.repository';

export interface CollectionsResponse {
  collections: Array<{ id: string; serviceId: string; collectedAt: string; status: 'ok' | 'erro' | 'sem_metricas'; cpuPercent: number | null; memoryGb: number | null; diskGb: number | null; networkGb: number | null; errorMessage: string | null }>;
  period: { from: string | null; to: string | null };
}
function map(row: CollectionListRow) {
  return { id: row.id, serviceId: row.service_id, collectedAt: row.collected_at.toISOString(), status: row.status,
    cpuPercent: row.cpu_percent === null ? null : Number(row.cpu_percent), memoryGb: row.memory_gb === null ? null : Number(row.memory_gb),
    diskGb: row.disk_gb === null ? null : Number(row.disk_gb), networkGb: row.network_gb === null ? null : Number(row.network_gb), errorMessage: row.error_message };
}
export async function getCollections(collections: CollectionRepository, services: ServiceRepository, filters: CollectionFilters): Promise<CollectionsResponse> {
  if (filters.serviceId !== null && await services.findById(filters.serviceId) === null) throw new NotFoundError('Serviço não encontrado.');
  return { collections: (await collections.findAll(filters)).map(map), period: { from: filters.from?.toISOString() ?? null, to: filters.to?.toISOString() ?? null } };
}
