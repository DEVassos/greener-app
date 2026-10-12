import { describe, expect, it } from 'vitest';
import { readEnvironment } from '../src/config/env';

describe('ambiente', () => {
  const databaseUrl = 'postgresql://user:pass@localhost/test';
  it('aceita configuração válida e porta padrão', () => {
    expect(readEnvironment({ DATABASE_URL: databaseUrl })).toEqual({
      port: 3000, databaseUrl, carbonApiUrl: 'https://carbon.unilaunch.org',
    });
    expect(readEnvironment({ PORT: '4321', DATABASE_URL: databaseUrl }).port).toBe(4321);
  });
  it.each(['', '0', '65536', '1.5', '3e3', 'abc'])('recusa porta %s', PORT => {
    expect(() => readEnvironment({ PORT, DATABASE_URL: databaseUrl })).toThrow('PORT');
  });
  it.each([undefined, '', 'https://localhost/db', 'postgresql://localhost/'])('recusa banco inválido', DATABASE_URL => {
    expect(() => readEnvironment({ DATABASE_URL })).toThrow('DATABASE_URL');
  });
  it('normaliza a base de carbono configurada', () => {
    expect(readEnvironment({ DATABASE_URL: databaseUrl, CARBON_API_URL: 'http://localhost:8080/api/' }).carbonApiUrl)
      .toBe('http://localhost:8080/api');
  });
  it.each(['', 'ftp://host', 'https://u:p@host', 'https://host/?key=x', 'https://host/#x'])
    ('recusa base de carbono inválida %s', CARBON_API_URL => {
      expect(() => readEnvironment({ DATABASE_URL: databaseUrl, CARBON_API_URL })).toThrow('CARBON_API_URL');
    });
});
