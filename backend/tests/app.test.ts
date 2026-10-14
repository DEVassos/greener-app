import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { errorHandler } from '../src/middlewares/error-handler';
import { DatabaseError } from '../src/shared/errors';
import { ServiceRepository } from '../src/modules/services/services.repository';

function createServicesRepository(rows: unknown[] = [], failure?: Error): ServiceRepository {
  return new ServiceRepository({ query: vi.fn().mockImplementation(async () => {
    if (failure) throw failure;
    return { rows };
  }) });
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
    const url = await serve(createApp(verify, createServicesRepository()));
    expect(await (await fetch(url + '/health')).json()).toEqual({ status: 'ok', db: 'ok' });
    const failed = await fetch(url + '/health');
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: { code: 'DATABASE_ERROR', message: 'Não foi possível verificar a conexão com o banco de dados.' } });
    expect((await fetch(url + '/health')).status).toBe(200);
    expect(verify).toHaveBeenCalledTimes(3);
  });
  it('recusa JSON inválido e rota inexistente', async () => {
    const url = await serve(createApp(async () => {}, createServicesRepository()));
    const bad = await fetch(url + '/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe('VALIDATION_ERROR');
    const missing = await fetch(url + '/missing');
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe('NOT_FOUND');
  });
  it('não expõe erro inesperado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const url = await serve(createApp(async () => { throw new Error('senha-secreta'); }, createServicesRepository()));
    const response = await fetch(url + '/health');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
  });
  it('lista serviços com a última leitura no contrato do dashboard', async () => {
    const url = await serve(createApp(async () => {}, createServicesRepository([{
      id: '9007199254740993', name: 'Demo', status: 'ativo', country: 'BR', region: 'Sul', city: 'Porto Alegre',
      last_reading_at: new Date('2026-10-14T20:00:00.000Z'), cpu_percent: '51.25',
    }])));
    const response = await fetch(url + '/api/services');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      services: [{ id: '9007199254740993', name: 'Demo', status: 'ativo', country: 'BR', region: 'Sul', city: 'Porto Alegre',
        cpuPercent: 51.25, energyKwh: null, emissionsG: null, lastReadingAt: '2026-10-14T20:00:00.000Z' }],
      period: 'última leitura disponível',
    });
  });
  it('devolve erro de banco sem stack e mantém a aplicação disponível', async () => {
    const url = await serve(createApp(async () => {}, createServicesRepository([], new DatabaseError())));
    const response = await fetch(url + '/api/services');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: 'DATABASE_ERROR', message: 'Não foi possível verificar a conexão com o banco de dados.' } });
    expect((await fetch(url + '/health')).status).toBe(200);
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
