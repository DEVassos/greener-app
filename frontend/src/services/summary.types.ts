// Contrato de GET /api/services/summary combinado na issue #175 (comentário de 23/10/2026).
// Ajustar quando o backend documentar a rota em docs/api.md.

import type { ServiceStatus } from './services.types';

/** Totais de todas as coletas do período, de todos os serviços (inclusive os removidos). */
export interface SummaryTotals {
  collections: number;
  /** Coletas com status diferente de "ok" (erro ou sem métricas). */
  failed: number;
  /** Coletas "ok" ainda sem cálculo de energia e CO₂e. */
  notCalculated: number;
  /** Soma das coletas calculadas, em kWh; null quando nenhuma está calculada (não é zero). */
  energyKwh: number | null;
  /** Soma das coletas calculadas, em gramas de CO₂e; null quando nenhuma está calculada. */
  co2eGrams: number | null;
  /** Média da intensidade de carbono das coletas calculadas, em gCO₂e/kWh; null quando nenhuma está calculada. */
  carbonIntensityGco2ePerKwh: number | null;
}

export interface SummaryResponse {
  /** Período pedido, ecoado pela API (ISO 8601 UTC); aberto no fim. */
  from: string;
  to: string;
  totals: SummaryTotals;
  /** Período de mesma duração imediatamente anterior, para a variação. */
  previous: { from: string; to: string; totals: SummaryTotals };
  /** Estado atual dos serviços (não depende do período). */
  servicesByStatus: Record<ServiceStatus, number> & { total: number };
}
