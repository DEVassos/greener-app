import { ExternalApiError } from '../shared/errors';
import type {
  RawMetricsResponse,
  RawServiceSummary,
  ServiceMetrics,
  ServiceMetricsResult,
  ServiceSummary,
} from './metrics-api.types';

export interface MetricsApiOptions {
  /** Base da API, sem barra final (vem de METRICS_API_URL em config/env.ts). */
  baseUrl: string;
  /** Tempo máximo de cada tentativa, em ms. */
  timeoutMs?: number;
  /** Injetável para os testes; em produção é o fetch nativo do Node. */
  fetchFn?: typeof fetch;
}

export interface MetricsApi {
  /** Serviços ativos registrados no agregador agora. */
  listServices(): Promise<ServiceSummary[]>;
  /** Métricas instantâneas de um serviço; 404 e 500 viram estados, não exceções. */
  getServiceMetrics(serviceId: string): Promise<ServiceMetricsResult>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
/** Falha de rede ou timeout ganha mais uma tentativa; respostas HTTP não são repetidas. */
const ATTEMPTS = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isServiceSummary(value: unknown): value is RawServiceSummary {
  if (!isRecord(value) || !isRecord(value.location)) return false;
  const { location } = value;
  return (
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    typeof value.metrics_path === 'string' &&
    typeof location.region_code === 'string' &&
    typeof location.country === 'string' &&
    typeof location.region === 'string' &&
    (typeof location.city === 'string' || location.city === null) &&
    isFiniteNumber(location.latitude) &&
    isFiniteNumber(location.longitude)
  );
}

function isMetricsResponse(value: unknown): value is RawMetricsResponse {
  if (!isRecord(value) || !isRecord(value.metrics)) return false;
  const { metrics } = value;
  return (
    isFiniteNumber(value.collection_interval_seconds) &&
    isFiniteNumber(metrics.cpu_percent) &&
    isFiniteNumber(metrics.memory_gb) &&
    isFiniteNumber(metrics.disk_gb) &&
    isFiniteNumber(metrics.network_gb)
  );
}

function toServiceSummary(raw: RawServiceSummary): ServiceSummary {
  return {
    id: raw.id,
    name: raw.name,
    location: {
      regionCode: raw.location.region_code,
      country: raw.location.country,
      region: raw.location.region,
      city: raw.location.city,
      latitude: raw.location.latitude,
      longitude: raw.location.longitude,
    },
    metricsPath: raw.metrics_path,
  };
}

function toServiceMetrics(raw: RawMetricsResponse): ServiceMetrics {
  return {
    collectionIntervalSeconds: raw.collection_interval_seconds,
    cpuPercent: raw.metrics.cpu_percent,
    memoryGb: raw.metrics.memory_gb,
    diskGb: raw.metrics.disk_gb,
    networkGb: raw.metrics.network_gb,
  };
}

/** Cliente HTTP da Greener Metrics Aggregator API. */
export function createMetricsApi({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, fetchFn = fetch }: MetricsApiOptions): MetricsApi {
  const base = baseUrl.replace(/\/+$/, '');

  /** GET com timeout por tentativa; falha de rede ou timeout é repetida uma vez. */
  async function get(path: string): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        return await fetchFn(`${base}${path}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        lastError = error;
      }
    }
    const timedOut = lastError instanceof Error && lastError.name === 'TimeoutError';
    throw new ExternalApiError(
      timedOut
        ? `A API de métricas não respondeu em ${timeoutMs / 1000} s (${path}).`
        : `Não foi possível conectar à API de métricas (${path}).`,
      lastError,
    );
  }

  async function readJson(response: Response, path: string): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      throw new ExternalApiError(`A API de métricas devolveu um corpo que não é JSON (${path}).`, error);
    }
  }

  return {
    async listServices() {
      const path = '/services';
      const response = await get(path);
      if (!response.ok) {
        throw new ExternalApiError(`A API de métricas respondeu HTTP ${response.status} em ${path}.`);
      }
      const body = await readJson(response, path);
      if (!Array.isArray(body)) {
        throw new ExternalApiError(`Resposta inesperada da API de métricas em ${path}: era esperada uma lista.`);
      }
      const invalid = body.findIndex((item) => !isServiceSummary(item));
      if (invalid !== -1) {
        throw new ExternalApiError(`Resposta inesperada da API de métricas em ${path}: item ${invalid} fora do formato.`);
      }
      return (body as RawServiceSummary[]).map(toServiceSummary);
    },

    async getServiceMetrics(serviceId) {
      const path = `/metrics/${encodeURIComponent(serviceId)}`;
      const response = await get(path);
      // Estados previstos pela especificação: 404 = removido ou sem métricas; 500 = serviço indisponível
      if (response.status === 404) return { status: 'sem_metricas' };
      if (response.status === 500) return { status: 'indisponivel' };
      if (!response.ok) {
        throw new ExternalApiError(`A API de métricas respondeu HTTP ${response.status} em ${path}.`);
      }
      const body = await readJson(response, path);
      if (!isMetricsResponse(body)) {
        throw new ExternalApiError(`Resposta inesperada da API de métricas em ${path}: métricas fora do formato.`);
      }
      return { status: 'ok', metrics: toServiceMetrics(body) };
    },
  };
}
