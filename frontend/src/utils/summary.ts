import type { MonitoredService } from '../services/services.types';

export interface ServicesSummary {
  totalEnergyKwh: number;
  totalEmissionsG: number;
  /** g CO₂e por kWh, ponderada pela energia; null se nenhum serviço tem energia medida. */
  averageIntensity: number | null;
  active: number;
  unavailable: number;
  withoutMetrics: number;
}

/** Totais dos KPIs de nível 1. Serviços removidos não entram na contagem. */
export function summarize(services: MonitoredService[]): ServicesSummary {
  const current = services.filter((service) => service.status !== 'removido');
  const totalEnergyKwh = current.reduce((sum, service) => sum + (service.energyKwh ?? 0), 0);
  const totalEmissionsG = current.reduce((sum, service) => sum + (service.emissionsG ?? 0), 0);

  return {
    totalEnergyKwh,
    totalEmissionsG,
    averageIntensity: totalEnergyKwh > 0 ? totalEmissionsG / totalEnergyKwh : null,
    active: current.filter((service) => service.status === 'ativo').length,
    unavailable: current.filter((service) => service.status === 'indisponivel').length,
    withoutMetrics: current.filter((service) => service.status === 'sem_metricas').length,
  };
}
