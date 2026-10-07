// Contrato provisório de GET /monitoring-settings (US07): rota da área restrita, exige Bearer.
// Ajustar quando o backend documentar a rota em docs/api.md.

export interface MonitoringSettings {
  /** Intervalo de coleta do worker, em segundos. */
  collectIntervalSeconds: number;
  /** API de intensidade de carbono usada no cálculo. */
  carbonApiUrl: string;
}
