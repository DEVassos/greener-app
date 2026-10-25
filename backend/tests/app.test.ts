import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { errorHandler } from '../src/middlewares/error-handler';
import { CollectionRepository } from '../src/modules/collections/collections.repository';
import { ServiceRepository } from '../src/modules/services/services.repository';
import { DatabaseError } from '../src/shared/errors';

function repositories(collectionRows: unknown[] = [], serviceRows: unknown[] = [], serviceFailure?: Error) {
  return {
    collections: new CollectionRepository({ query: vi.fn().mockResolvedValue({ rows: collectionRows }) }),
    services: new ServiceRepository({ query: vi.fn().mockImplementation(async () => {
      if (serviceFailure) throw serviceFailure;
      return { rows: serviceRows };
    }) }),
  };
}

const servers: Server[] = [];
async function serve(app: ReturnType<typeof express>): Promise<string> {
  const server = createServer(app); servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
  })));
  vi.restoreAllMocks();
});

describe('HTTP', () => {
  it('verifica em cada chamada, informa falha e recupera', async () => {
    const verify = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new DatabaseError()).mockResolvedValueOnce(undefined);
    const { collections, services } = repositories(); const url = await serve(createApp(verify, collections, services));
    expect(await (await fetch(url + '/health')).json()).toEqual({ status: 'ok', db: 'ok' });
    expect((await fetch(url + '/health')).status).toBe(500);
    expect((await fetch(url + '/health')).status).toBe(200);
  });
  it('recusa JSON inválido e rota inexistente', async () => {
    const { collections, services } = repositories(); const url = await serve(createApp(async () => {}, collections, services));
    expect((await fetch(url + '/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status).toBe(400);
    expect((await fetch(url + '/missing')).status).toBe(404);
  });
  it('lista serviços com a última leitura', async () => {
    const { collections, services } = repositories([], [{ id: '1', name: 'Demo', status: 'ativo', country: 'BR', region: 'Sul', city: null, last_reading_at: new Date('2026-10-14T20:00:00.000Z'), cpu_percent: '51.25', energy_kwh: '0.000480452625', co2e_grams: '0.040838473125' }]);
    const response = await fetch(await serve(createApp(async () => {}, collections, services)) + '/api/services');
    expect(response.status).toBe(200); expect((await response.json()).services[0]).toMatchObject({ id: '1', cpuPercent: 51.25,
      energyKwh: 0.000480452625, emissionsG: 0.040838473125 });
  });
  it('valida filtros de collections', async () => {
    const { collections, services } = repositories();
    expect((await fetch(await serve(createApp(async () => {}, collections, services)) + '/api/collections?limit=abc')).status).toBe(400);
  });
  it('retorna 404 para service_id inexistente', async () => {
    const { collections, services } = repositories([], []);
    expect((await fetch(await serve(createApp(async () => {}, collections, services)) + '/api/collections?service_id=99')).status).toBe(404);
  });
  it('expõe os campos de cálculo e separa não calculado de zero', async () => {
    const base = { service_id: '1', collected_at: new Date('2026-10-14T20:00:00.000Z'), status: 'ok',
      cpu_percent: '10.00', memory_gb: '1.000000000', disk_gb: '2.000000000', network_gb: '3.000000000', error_message: null };
    const rows = [
      { ...base, id: '1', calculation_status: 'disponivel', carbon_intensity_gco2e_per_kwh: '85.000000',
        energy_kwh: '0.000480452625', co2e_grams: '0.040838473125' },
      { ...base, id: '2', collected_at: new Date('2026-10-14T20:05:00.000Z'), calculation_status: 'disponivel',
        carbon_intensity_gco2e_per_kwh: '85.000000', energy_kwh: '0.000000000000', co2e_grams: '0.000000000000' },
      { ...base, id: '3', collected_at: new Date('2026-10-14T20:10:00.000Z'), calculation_status: 'nao_calculado',
        carbon_intensity_gco2e_per_kwh: null, energy_kwh: null, co2e_grams: null },
      { ...base, id: '4', collected_at: new Date('2026-10-14T20:15:00.000Z'), calculation_status: 'indisponivel',
        carbon_intensity_gco2e_per_kwh: null, energy_kwh: null, co2e_grams: null },
    ];
    const { collections, services } = repositories(rows, [{ id: '1', name: 'Demo', status: 'ativo', country: 'BR', region: 'Sul',
      city: null, last_reading_at: null, cpu_percent: null, energy_kwh: null, co2e_grams: null }]);
    const body = await (await fetch(await serve(createApp(async () => {}, collections, services)) + '/api/collections?service_id=1')).json();
    expect(body.collections[0]).toMatchObject({ calculationStatus: 'disponivel', energyKwh: 0.000480452625,
      co2eGrams: 0.040838473125, carbonIntensityGco2ePerKwh: 85 });
    expect(body.collections[1]).toMatchObject({ calculationStatus: 'disponivel', energyKwh: 0, co2eGrams: 0 });
    expect(body.collections[2]).toMatchObject({ calculationStatus: 'nao_calculado', energyKwh: null, co2eGrams: null,
      carbonIntensityGco2ePerKwh: null });
    expect(body.collections[3]).toMatchObject({ calculationStatus: 'indisponivel', energyKwh: null, co2eGrams: null });
  });
  it('protege erros inesperados', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { collections, services } = repositories();
    expect((await fetch(await serve(createApp(async () => { throw new Error('senha'); }, collections, services)) + '/health')).status).toBe(500);
  });
  it('preserva o error handler isolado', async () => {
    const app = express(); app.use(express.json()); app.post('/test', (req, res) => res.json(req.body)); app.use(errorHandler);
    expect((await fetch(await serve(app) + '/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"value":1}' })).status).toBe(200);
  });
});

describe('CORS', () => {
  const frontend = 'http://localhost:5173';
  async function corsApp(): Promise<string> {
    const { collections, services } = repositories();
    return serve(createApp(async () => {}, collections, services, [frontend]));
  }
  it('libera a origem do frontend nas respostas', async () => {
    const response = await fetch(await corsApp() + '/api/services', { headers: { Origin: frontend } });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(frontend);
    expect(response.headers.get('vary')).toContain('Origin');
  });
  it('responde o preflight com 204 sem chegar às rotas', async () => {
    const response = await fetch(await corsApp() + '/api/services', { method: 'OPTIONS', headers: {
      Origin: frontend, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' } });
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(frontend);
    expect(response.headers.get('access-control-allow-headers')).toContain('Authorization');
  });
  it('não libera origem fora da lista nem chamada sem origem', async () => {
    const url = await corsApp();
    const other = await fetch(url + '/api/services', { headers: { Origin: 'http://evil.example' } });
    expect(other.status).toBe(200);
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
    expect((await fetch(url + '/api/services')).headers.get('access-control-allow-origin')).toBeNull();
    const preflight = await fetch(url + '/api/services', { method: 'OPTIONS', headers: { Origin: 'http://evil.example' } });
    expect(preflight.headers.get('access-control-allow-origin')).toBeNull();
  });
});
