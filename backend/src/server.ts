import { createServer, type Server } from 'node:http';
import { createApp } from './app';
import { readEnvironment, type Environment } from './config/env';
import { createDatabase, type Database } from './db/connection';
import { verifyConnection } from './modules/health/health.repository';
import { AppError } from './shared/errors';

export async function startServer(env: Environment, database: Database): Promise<Server> {
  try {
    await verifyConnection(database);
    const server = createServer(createApp(() => verifyConnection(database)));
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(env.port, () => { server.off('error', reject); resolve(); });
    });
    return server;
  } catch (error) {
    await database.close();
    throw error;
  }
}

export async function stopServer(server: Server, database: Database): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeIdleConnections();
    });
  } finally { await database.close(); }
}

async function main(): Promise<void> {
  const env = readEnvironment();
  const database = createDatabase(env.databaseUrl);
  const server = await startServer(env, database);
  console.info(`API disponível na porta ${env.port}.`);
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    void stopServer(server, database).then(() => clearTimeout(deadline)).catch(() => {
      console.error('Falha ao encerrar servidor e banco.');
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error instanceof AppError ? error.message : 'Não foi possível iniciar o servidor.');
    process.exitCode = 1;
  });
}
