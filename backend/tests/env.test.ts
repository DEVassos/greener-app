import { describe, expect, it } from 'vitest';
import { readEnvironment } from '../src/config/env';

describe('ambiente', () => {
  const databaseUrl = 'postgresql://user:pass@localhost/test';
  it.each(['0', '-1', '1.5', '2147483648', 'NaN', ''])('recusa polling inválido %s', POLLING_INTERVAL_MS => {
    expect(() => readEnvironment({ DATABASE_URL: databaseUrl, POLLING_INTERVAL_MS })).toThrow('POLLING_INTERVAL_MS');
  });
  it('aceita limites do dispatcher', () => {
    for (const value of [1, 2147483647])
      expect(readEnvironment({ DATABASE_URL: databaseUrl, POLLING_INTERVAL_MS: String(value) }).pollingIntervalMs).toBe(value);
  });
  it('aceita configuração válida e porta padrão', () => {
    expect(readEnvironment({ DATABASE_URL: databaseUrl })).toEqual({
      port: 3000,
      databaseUrl,
      metricsApiUrl: 'https://metrics.unilaunch.org',
      pollingIntervalMs: 30000,
    });
    expect(readEnvironment({ PORT: '4321', DATABASE_URL: databaseUrl }).port).toBe(4321);
  });
  it.each(['', '0', '65536', '1.5', '3e3', 'abc'])('recusa porta %s', PORT => {
    expect(() => readEnvironment({ PORT, DATABASE_URL: databaseUrl })).toThrow('PORT');
  });
  it.each([undefined, '', 'https://localhost/db', 'postgresql://localhost/'])('recusa banco inválido', DATABASE_URL => {
    expect(() => readEnvironment({ DATABASE_URL })).toThrow('DATABASE_URL');
  });
  it('aceita METRICS_API_URL própria e remove a barra final', () => {
    const env = readEnvironment({ DATABASE_URL: databaseUrl, METRICS_API_URL: 'http://localhost:4000/' });
    expect(env.metricsApiUrl).toBe('http://localhost:4000');
  });
  it.each(['metrics.unilaunch.org', 'ftp://metrics.unilaunch.org', 'não é url'])('recusa METRICS_API_URL %s', METRICS_API_URL => {
    expect(() => readEnvironment({ DATABASE_URL: databaseUrl, METRICS_API_URL })).toThrow('METRICS_API_URL');
  });
});
