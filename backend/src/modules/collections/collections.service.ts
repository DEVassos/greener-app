import type { CalculationStatus } from '../../shared/persistence.types';
import { NotFoundError } from '../../shared/errors';
import { ServiceRepository } from '../services/services.repository';
import { CollectionRepository, type CollectionFilters, type CollectionListRow } from './collections.repository';

export interface CollectionItem {
  id: string; serviceId: string; collectedAt: string; status: 'ok' | 'erro' | 'sem_metricas';
  cpuPercent: number | null; memoryGb: number | null; diskGb: number | null; networkGb: number | null; errorMessage: string | null;
  calculationStatus: CalculationStatus;
  energyKwh: number | null; co2eGrams: number | null; carbonIntensityGco2ePerKwh: number | null;
}
export interface CollectionsResponse {
  collections: CollectionItem[];
  period: { from: string | null; to: string | null };
}
const numberOrNull = (value: string | null): number | null => (value === null ? null : Number(value));
function map(row: CollectionListRow): CollectionItem {
  return { id: row.id, serviceId: row.service_id, collectedAt: row.collected_at.toISOString(), status: row.status,
    cpuPercent: numberOrNull(row.cpu_percent), memoryGb: numberOrNull(row.memory_gb),
    diskGb: numberOrNull(row.disk_gb), networkGb: numberOrNull(row.network_gb), errorMessage: row.error_message,
    calculationStatus: row.calculation_status, energyKwh: numberOrNull(row.energy_kwh), co2eGrams: numberOrNull(row.co2e_grams),
    carbonIntensityGco2ePerKwh: numberOrNull(row.carbon_intensity_gco2e_per_kwh) };
}
export async function getCollections(collections: CollectionRepository, services: ServiceRepository, filters: CollectionFilters): Promise<CollectionsResponse> {
  if (filters.serviceId !== null && await services.findById(filters.serviceId) === null) throw new NotFoundError('Serviço não encontrado.');
  return { collections: (await collections.findAll(filters)).map(map), period: { from: filters.from?.toISOString() ?? null, to: filters.to?.toISOString() ?? null } };
}
