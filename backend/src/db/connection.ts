import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { DatabaseError } from '../shared/errors';

export interface Database {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
}

export function createDatabase(databaseUrl: string): Database {
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 3000,
    statement_timeout: 3000, query_timeout: 4000 });
  // Erro em conexão ociosa não pode virar evento sem listener nem expor a URL.
  pool.on('error', () => console.error('Falha em conexão ociosa do PostgreSQL.'));
  return {
    async query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
      try { return await pool.query<T>(text, params); }
      catch {
        console.error('Falha ao executar consulta PostgreSQL.');
        throw new DatabaseError();
      }
    },
    close: () => pool.end(),
  };
}
