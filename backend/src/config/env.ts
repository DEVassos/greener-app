import { ValidationError } from '../shared/errors';

export interface Environment {
  port: number;
  databaseUrl: string;
  carbonApiUrl: string;
  metricsApiUrl: string;
  pollingIntervalMs: number;
  /** Origens do frontend liberadas por CORS (ex.: http://localhost:5173). */
  corsOrigins: string[];
}

const DEFAULT_METRICS_API_URL = 'https://metrics.unilaunch.org';
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

/** CORS compara a origem exata do navegador: protocolo http(s), host e porta, sem caminho. */
function readCorsOrigins(text: string): string[] {
  const origins = text.split(',').map(item => item.trim()).filter(Boolean);
  if (origins.length === 0) throw new ValidationError('CORS_ORIGIN deve listar ao menos uma origem.');
  return origins.map(item => {
    try {
      const url = new URL(item);
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== item.replace(/\/$/, '')) throw new Error('Origem inválida');
      return url.origin;
    } catch {
      throw new ValidationError('CORS_ORIGIN deve listar origens http(s) separadas por vírgula, sem caminho (ex.: http://localhost:5173).');
    }
  });
}

export function readEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const portText = source.PORT ?? '3000';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ValidationError('PORT deve ser um inteiro entre 1 e 65535.');
  }
  const databaseUrl = source.DATABASE_URL;
  try {
    const url = new URL(databaseUrl ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length <= 1) {
      throw new Error('Formato inválido');
    }
  } catch {
    throw new ValidationError('DATABASE_URL deve informar uma URL PostgreSQL com host e banco.');
  }
  let carbonApiUrl: URL;
  try {
    carbonApiUrl = new URL(source.CARBON_API_URL ?? 'https://carbon.unilaunch.org');
    if (!['http:', 'https:'].includes(carbonApiUrl.protocol)
      || carbonApiUrl.username || carbonApiUrl.password || carbonApiUrl.search || carbonApiUrl.hash) {
      throw new Error('URL inválida');
    }
  } catch {
    throw new ValidationError('CARBON_API_URL deve ser uma URL http(s), sem credenciais, query ou fragmento.');
  }

  const metricsApiText = source.METRICS_API_URL || DEFAULT_METRICS_API_URL;
  let metricsApiUrl: URL;
  try {
    metricsApiUrl = new URL(metricsApiText);
    if (!['http:', 'https:'].includes(metricsApiUrl.protocol)) throw new Error('Protocolo inválido');
  } catch {
    throw new ValidationError('METRICS_API_URL deve ser uma URL http(s) da API agregadora de métricas.');
  }
  const pollingText = source.POLLING_INTERVAL_MS ?? '30000';
  const pollingIntervalMs = Number(pollingText);
  if (!/^\d+$/.test(pollingText) || !Number.isInteger(pollingIntervalMs)
    || pollingIntervalMs < 1 || pollingIntervalMs > 2147483647) {
    throw new ValidationError('POLLING_INTERVAL_MS deve ser inteiro de 1 a 2147483647 ms.');
  }
  return {
    port,
    databaseUrl: databaseUrl!,
    carbonApiUrl: carbonApiUrl.toString().replace(/\/+$/, ''),
    metricsApiUrl: metricsApiText.replace(/\/+$/, ''),
    pollingIntervalMs,
    corsOrigins: readCorsOrigins(source.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN),
  };
}
