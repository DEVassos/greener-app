// Contrato provisório de GET /services (US01 / US04).
// Ajustar quando o backend documentar a rota em docs/api.md.

/** Estados de monitoramento de um serviço (mesmos nomes do backend). */
export type ServiceStatus = 'ativo' | 'indisponivel' | 'sem_metricas' | 'removido';

export interface MonitoredService {
  id: string;
  name: string;
  /** Localização informada pelo agregador. */
  country: string;
  region: string;
  city: string | null;
  /** Uso de CPU na última leitura, em %; null quando não há métrica. */
  cpuPercent: number | null;
  /** Energia estimada no período, em kWh; null quando não há métrica. */
  energyKwh: number | null;
  /** Emissão estimada no período, em gramas de CO₂e; null quando não há métrica. */
  emissionsG: number | null;
  status: ServiceStatus;
  /** Horário da última leitura (ISO 8601); null se nunca houve leitura. */
  lastReadingAt: string | null;
}

export interface ServicesResponse {
  services: MonitoredService[];
  /** Período considerado nos totais de energia e emissão, como a API devolve (ex.: "última 1 hora"). */
  period: string;
}
