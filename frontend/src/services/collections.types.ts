// Contrato de GET /api/collections (docs/api.md § GET /api/collections).

/** Resultado de uma coleta: métricas lidas, falha na chamada ou serviço sem métricas. */
export type CollectionStatus = 'ok' | 'erro' | 'sem_metricas';

export interface ServiceCollection {
  id: string;
  serviceId: string;
  /** Horário da coleta (ISO 8601). */
  collectedAt: string;
  status: CollectionStatus;
  /**
   * Intervalo informado pela API de métricas para aquela coleta, em segundos;
   * null quando a coleta não trouxe métricas (`erro` ou `sem_metricas`).
   */
  collectionIntervalSeconds: number | null;
  /** Uso de CPU, em %; null quando a coleta não trouxe a métrica. */
  cpuPercent: number | null;
  memoryGb: number | null;
  diskGb: number | null;
  networkGb: number | null;
  /** Motivo da falha quando `status` é `erro`. */
  errorMessage: string | null;
}

export interface CollectionsResponse {
  /** Da coleta mais recente para a mais antiga. */
  collections: ServiceCollection[];
  /** Período pedido na consulta; null quando não houve filtro de data. */
  period: { from: string | null; to: string | null };
}
