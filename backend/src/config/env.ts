import { ValidationError } from '../shared/errors';

export interface Environment { port: number; databaseUrl: string; carbonApiUrl: string; metricsApiUrl: string }


const DEFAULT_METRICS_API_URL = 'https://metrics.unilaunch.org';

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
  return { port, databaseUrl: databaseUrl!, carbonApiUrl: carbonApiUrl.toString().replace(/\/+$/, ''), metricsApiUrl: metricsApiText.replace(/\/+$/, '') };
}
