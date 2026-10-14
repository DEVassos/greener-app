import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { errorHandler } from '../src/middlewares/error-handler';
import { DatabaseError } from '../src/shared/errors';
import { CollectionRepository } from '../src/modules/collections/collections.repository';
import { ServiceRepository } from '../src/modules/services/services.repository';

function repositories(collectionRows: unknown[] = [], serviceRows: unknown[] = []) {
  return {
    collections: new CollectionRepository({ query: vi.fn().mockResolvedValue({ rows: collectionRows }) }),
    services: new ServiceRepository({ query: vi.fn().mockResolvedValue({ rows: serviceRows }) }),
  };
}

const servers: Server[] = [];
async function serve(app: ReturnType<typeof express>): Promise<string> {
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  })));
  vi.restoreAllMocks();
});

describe('HTTP', () => {
  it('verifica em cada chamada, informa falha e recupera', async () => {
    const verify = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new DatabaseError()).mockResolvedValueOnce(undefined);
    const { collections, services } = repositories();
    const url = await serve(createApp(verify, collections, services));
    expect(await (await fetch(url + '/health')).json()).toEqual({ status: 'ok', db: 'ok' });
    const failed = await fetch(url + '/health');
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: { code: 'DATABASE_ERROR', message: 'Não foi possível verificar a conexão com o banco de dados.' } });
    expect((await fetch(url + '/health')).status).toBe(200);
    expect(verify).toHaveBeenCalledTimes(3);
  });
  it('recusa JSON inválido e rota inexistente', async () => {
    const { collections, services } = repositories();
    const url = await serve(createApp(async () => {}, collections, services));
    const bad = await fetch(url + '/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe('VALIDATION_ERROR');
    const missing = await fetch(url + '/missing');
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe('NOT_FOUND');
  });
  it('não expõe erro inesperado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { collections, services } = repositories();
    const url = await serve(createApp(async () => { throw new Error('senha-secreta'); }, collections, services));
    const response = await fetch(url + '/health');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
  });
  it('valida filtros de collections antes de consultar o banco', async () => {
    const { collections, services } = repositories();
    const url = await serve(createApp(async () => {}, collections, services));
    const response = await fetch(url + '/api/collections?limit=abc');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'VALIDATION_ERROR', message: 'limit deve ser inteiro entre 1 e 500.' } });
  });
  it('retorna 404 para service_id inexistente', async () => {
    const { collections, services } = repositories([], []);
    const url = await serve(createApp(async () => {}, collections, services));
    const response = await fetch(url + '/api/collections?service_id=99');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Serviço não encontrado.' } });
  });
  it('parser entrega objeto JSON em aplicação exclusiva do teste', async () => {
    const app = express();
    app.use(express.json());
    app.post('/test', (req, res) => res.json(req.body));
    app.use(errorHandler);
    const url = await serve(app);
    const response = await fetch(url + '/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"value":1}' });
    expect(await response.json()).toEqual({ value: 1 });
  });
});
