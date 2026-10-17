import type { ServiceStatus } from '../../shared/persistence.types';
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
    status: service.status,
    lastReadingAt: service.last_reading_at?.toISOString() ?? null,
  };
}

export async function getServices(repository: ServiceRepository): Promise<ServicesResponse> {
  return { services: (await repository.findAllWithLastReading()).map(toMonitoredService), period: PERIOD };
}
