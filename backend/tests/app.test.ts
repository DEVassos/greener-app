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
  it('devolve a série por intervalo com os totais do período', async () => {
    const seriesRows = [
      { bucket_start: new Date('2026-10-23T01:30:00.000Z'), collections: '12', failed: '0', not_calculated: '1',
        energy_kwh: '0.007480167692', co2e_grams: '0.635814253804', co2e_min_grams: '0.007808506456',
        co2e_max_grams: '0.089094607769', carbon_intensity_gco2e_per_kwh: '85.0000000000000000' },
      { bucket_start: new Date('2026-10-23T01:45:00.000Z'), collections: '3', failed: '2', not_calculated: '1',
        energy_kwh: null, co2e_grams: null, co2e_min_grams: null, co2e_max_grams: null, carbon_intensity_gco2e_per_kwh: null },
      { bucket_start: null, collections: '15', failed: '2', not_calculated: '2',
        energy_kwh: '0.007480167692', co2e_grams: '0.635814253804', co2e_min_grams: '0.007808506456',
        co2e_max_grams: '0.089094607769', carbon_intensity_gco2e_per_kwh: '85.0000000000000000' },
    ];
    const { collections, services } = repositories(seriesRows, [{ id: '1' }]);
    const response = await fetch(await serve(createApp(async () => {}, collections, services))
      + '/api/collections/series?service_id=1&from=2026-10-23T00:00:00Z&to=2026-10-24T00:00:00Z&bucket=15min');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      serviceId: '1', from: '2026-10-23T00:00:00.000Z', to: '2026-10-24T00:00:00.000Z', bucket: '15min',
      buckets: [
        { start: '2026-10-23T01:30:00.000Z', collections: 12, failed: 0, notCalculated: 1,
          energyKwh: 0.007480167692, co2eGrams: 0.635814253804, co2eMinGrams: 0.007808506456, co2eMaxGrams: 0.089094607769 },
        { start: '2026-10-23T01:45:00.000Z', collections: 3, failed: 2, notCalculated: 1,
          energyKwh: null, co2eGrams: null, co2eMinGrams: null, co2eMaxGrams: null },
      ],
      totals: { collections: 15, failed: 2, notCalculated: 2, energyKwh: 0.007480167692, co2eGrams: 0.635814253804,
        co2eMaxGrams: 0.089094607769, carbonIntensityGco2ePerKwh: 85 },
    });
  });
  it('retorna 404 para série de serviço inexistente', async () => {
    const { collections, services } = repositories([], []);
    expect((await fetch(await serve(createApp(async () => {}, collections, services))
      + '/api/collections/series?service_id=99&from=2026-10-23T00:00:00Z&to=2026-10-24T00:00:00Z&bucket=1h')).status).toBe(404);
  });
  it.each([
    'service_id=1&from=2026-10-23T00:00:00Z&to=2026-10-24T00:00:00Z',
    'from=2026-10-23T00:00:00Z&to=2026-10-24T00:00:00Z&bucket=15min',
    'service_id=1&to=2026-10-24T00:00:00Z&bucket=15min',
    'service_id=1&from=2026-10-23T00:00:00Z&bucket=15min',
    'service_id=1&from=2026-10-23T00:00:00Z&to=2026-10-24T00:00:00Z&bucket=1min',
    'service_id=1&from=2026-10-24T00:00:00Z&to=2026-10-23T00:00:00Z&bucket=1h',
    'service_id=1&from=2026-09-01T00:00:00Z&to=2026-10-24T00:00:00Z&bucket=1d',
  ])('recusa série inválida com 400: %s', async query => {
    const { collections, services } = repositories([], [{ id: '1' }]);
    const url = await serve(createApp(async () => {}, collections, services));
    expect((await fetch(url + '/api/collections/series?' + query)).status).toBe(400);
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
