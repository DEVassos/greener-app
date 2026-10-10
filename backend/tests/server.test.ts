import type { AddressInfo } from 'node:net';
import type { QueryResult, QueryResultRow } from 'pg';
import { expect, it, vi } from 'vitest';
import type { Database } from '../src/db/connection';
import { startServer, stopServer } from '../src/server';
import { DatabaseError } from '../src/shared/errors';

function fakeDatabase(connected: boolean): Database {
  return {
    async query<T extends QueryResultRow>(): Promise<QueryResult<T>> {
      if (!connected) throw new DatabaseError();
      return { rows: [{ connected: 1 }] as unknown as T[], rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    },
    close: vi.fn(async () => undefined),
  };
}
const env = { port: 0, databaseUrl: 'postgresql://localhost/test' };
it('não inicia HTTP se o banco falhar e fecha pool', async () => {
  const database = fakeDatabase(false);
  await expect(startServer(env, database)).rejects.toBeInstanceOf(DatabaseError);
  expect(database.close).toHaveBeenCalledOnce();
});
it('inicia com banco válido e encerra servidor e pool', async () => {
  const database = fakeDatabase(true);
  const server = await startServer(env, database);
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/health`;
    expect((await fetch(url)).status).toBe(200);
  } finally { await stopServer(server, database); }
  expect(server.listening).toBe(false);
  expect(database.close).toHaveBeenCalledOnce();
});
