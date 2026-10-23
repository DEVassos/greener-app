import { NotFoundError } from '../../shared/errors';
import { ServiceRepository } from '../services/services.repository';
import { CollectionRepository, type CollectionFilters, type CollectionListRow, type SeriesBucket, type SeriesFilters, type SeriesRow } from './collections.repository';

export interface CollectionsResponse {
  collections: Array<{ id: string; serviceId: string; collectedAt: string; status: 'ok' | 'erro' | 'sem_metricas'; cpuPercent: number | null; memoryGb: number | null; diskGb: number | null; networkGb: number | null; errorMessage: string | null }>;
  period: { from: string | null; to: string | null };
}
export interface SeriesPoint {
  start: string; collections: number; failed: number; notCalculated: number;
  energyKwh: number | null; co2eGrams: number | null; co2eMinGrams: number | null; co2eMaxGrams: number | null;
}
export interface SeriesTotals {
  collections: number; failed: number; notCalculated: number;
  energyKwh: number | null; co2eGrams: number | null; co2eMaxGrams: number | null; carbonIntensityGco2ePerKwh: number | null;
}
export interface SeriesResponse { serviceId: string; from: string; to: string; bucket: SeriesBucket; buckets: SeriesPoint[]; totals: SeriesTotals }
function metric(value: string | null): number | null {
  return value === null ? null : Number(value);
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
function toPoint(row: SeriesRow & { bucket_start: Date }): SeriesPoint {
  return { start: row.bucket_start.toISOString(), collections: Number(row.collections), failed: Number(row.failed),
    notCalculated: Number(row.not_calculated), energyKwh: metric(row.energy_kwh), co2eGrams: metric(row.co2e_grams),
    co2eMinGrams: metric(row.co2e_min_grams), co2eMaxGrams: metric(row.co2e_max_grams) };
}
export async function getSeries(collections: CollectionRepository, services: ServiceRepository, filters: SeriesFilters): Promise<SeriesResponse> {
  if (await services.findById(filters.serviceId) === null) throw new NotFoundError('Serviço não encontrado.');
  const rows = await collections.findSeries(filters);
  const total = rows.find(row => row.bucket_start === null);
  return {
    serviceId: filters.serviceId, from: filters.from.toISOString(), to: filters.to.toISOString(), bucket: filters.bucket,
    buckets: rows.filter((row): row is SeriesRow & { bucket_start: Date } => row.bucket_start !== null).map(toPoint),
    totals: { collections: Number(total?.collections ?? 0), failed: Number(total?.failed ?? 0),
      notCalculated: Number(total?.not_calculated ?? 0), energyKwh: metric(total?.energy_kwh ?? null),
      co2eGrams: metric(total?.co2e_grams ?? null), co2eMaxGrams: metric(total?.co2e_max_grams ?? null),
      carbonIntensityGco2ePerKwh: metric(total?.carbon_intensity_gco2e_per_kwh ?? null) },
  };
}
