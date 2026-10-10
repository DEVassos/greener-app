import { ValidationError } from '../shared/errors';

export interface Environment { port: number; databaseUrl: string }

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
  return { port, databaseUrl: databaseUrl! };
}
