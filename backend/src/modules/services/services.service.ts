import type { ServiceStatus } from '../../shared/persistence.types';
import { MonitoringStatus } from '../../domain/monitoring-status';
import { ServiceRepository, type ServiceWithLastReading } from './services.repository';

export interface MonitoredService {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  city: string | null;
  cpuPercent: number | null;
  energyKwh: number | null;
  emissionsG: number | null;
  status: ServiceStatus;
  lastReadingAt: string | null;
}

export interface ServicesResponse {
  services: MonitoredService[];
  period: string;
}

const PERIOD = 'última leitura (intervalo de coleta)';

function toMonitoredService(service: ServiceWithLastReading): MonitoredService {
  return {
    id: String(service.id),
    name: service.name,
    country: service.country,
    region: service.region,
    city: service.city,
    cpuPercent: service.cpu_percent === null ? null : Number(service.cpu_percent),
    energyKwh: service.energy_kwh === null ? null : Number(service.energy_kwh),
    emissionsG: service.co2e_grams === null ? null : Number(service.co2e_grams),
    status: MonitoringStatus.fromValue(service.status).value(),
    lastReadingAt: service.last_reading_at?.toISOString() ?? null,
  };
}

export async function getServices(repository: ServiceRepository): Promise<ServicesResponse> {
  return { services: (await repository.findAllWithLastReading()).map(toMonitoredService), period: PERIOD };
}
export interface ServicesSummaryResponse { period: { from: string; to: string }; energyKwh: number; co2eGrams: number; services: { active: number; unavailable: number; withoutMetrics: number; removed: number } }
export async function getServicesSummary(repository: ServiceRepository, period: { from: Date; to: Date }): Promise<ServicesSummaryResponse> {
  const row = await repository.findSummary(period.from, period.to);
  return { period: { from: period.from.toISOString(), to: period.to.toISOString() }, energyKwh: Number(row.energy_kwh), co2eGrams: Number(row.co2e_grams), services: { active: Number(row.active), unavailable: Number(row.unavailable), withoutMetrics: Number(row.without_metrics), removed: Number(row.removed) } };
}
