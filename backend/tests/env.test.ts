import { describe, expect, it } from 'vitest';
import { readEnvironment } from '../src/config/env';

describe('ambiente', () => {
  const databaseUrl = 'postgresql://user:pass@localhost/test';
  it('aceita configuração válida e porta padrão', () => {
    expect(readEnvironment({ DATABASE_URL: databaseUrl })).toEqual({ port: 3000, databaseUrl });
    expect(readEnvironment({ PORT: '4321', DATABASE_URL: databaseUrl }).port).toBe(4321);
  });
  it.each(['', '0', '65536', '1.5', '3e3', 'abc'])('recusa porta %s', PORT => {
    expect(() => readEnvironment({ PORT, DATABASE_URL: databaseUrl })).toThrow('PORT');
  });
  it.each([undefined, '', 'https://localhost/db', 'postgresql://localhost/'])('recusa banco inválido', DATABASE_URL => {
    expect(() => readEnvironment({ DATABASE_URL })).toThrow('DATABASE_URL');
  });
});
