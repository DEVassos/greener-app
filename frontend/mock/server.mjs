// Backend FALSO, só para desenvolvimento e revisão do frontend enquanto a API real não existe.
// Implementa o contrato provisório que o frontend espera (frontend/README.md § Backend falso).
// Não vai para produção nem para o compose: quem implementa as rotas de verdade é o backend (BE-02, US01).
//
// Uso: npm run mock  →  http://localhost:3000  (com VITE_API_URL=http://localhost:3000 no .env da raiz)

import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 3000);

/**
 * Cenário de GET /services, para ver os estados da tela:
 *   (padrão) lista normal · MOCK_SERVICES=vazio lista vazia · MOCK_SERVICES=erro responde 500
 */
const SERVICES_SCENARIO = process.env.MOCK_SERVICES ?? 'normal';

const SERVICES = [
  { id: 'fraud-detector', name: 'Fraud Detector', country: 'Estados Unidos', region: 'us-east', city: 'Virgínia', cpu: 68, kwh: 0.0713, gramsPerKwh: 377, status: 'ativo' },
  { id: 'recommendation-ai', name: 'Recommendation AI', country: 'Irlanda', region: 'eu-west', city: 'Dublin', cpu: 74, kwh: 0.0868, gramsPerKwh: 295, status: 'ativo' },
  { id: 'audit-stream', name: 'Audit Stream', country: 'Japão', region: 'jp-east', city: 'Tóquio', cpu: 41, kwh: 0.0533, gramsPerKwh: 465, status: 'ativo' },
  { id: 'checkout-worker', name: 'Checkout Worker', country: 'Estados Unidos', region: 'us-east', city: 'Virgínia', cpu: 45, kwh: 0.0467, gramsPerKwh: 377, status: 'ativo' },
  { id: 'reporting-batch', name: 'Reporting Batch', country: 'Canadá', region: 'ca-central', city: 'Montreal', cpu: 52, kwh: 0.0726, gramsPerKwh: 40, status: 'ativo' },
  { id: 'email-dispatcher', name: 'Email Dispatcher', country: 'Brasil', region: 'br-sudeste', city: 'São Paulo', status: 'indisponivel' },
  { id: 'inventory-sync', name: 'Inventory Sync', country: 'Canadá', region: 'ca-central', city: null, status: 'sem_metricas' },
];

/** Leitura "ao vivo": a CPU varia um pouco a cada chamada, para a atualização mostrar mudança na tela. */
function readService(service) {
  const base = { id: service.id, name: service.name, country: service.country, region: service.region, city: service.city, status: service.status };
  if (service.status !== 'ativo') {
    return { ...base, cpuPercent: null, energyKwh: null, emissionsG: null, lastReadingAt: null };
  }
  const factor = 1 + (Math.random() - 0.5) * 0.1;
  const energyKwh = Number((service.kwh * factor).toFixed(4));
  return {
    ...base,
    cpuPercent: Math.round(service.cpu * factor),
    energyKwh,
    emissionsG: Number((energyKwh * service.gramsPerKwh).toFixed(1)),
    lastReadingAt: new Date().toISOString(),
  };
}

/**
 * Histórico de um serviço: `limit` coletas a cada 30 s até agora, da mais recente para a mais antiga.
 * Ativo: CPU variando a cada chamada · indisponível: as 10 coletas mais recentes com erro · sem métricas: vazio.
 */
function serviceCollections(service, limit) {
  if (service.status === 'sem_metricas') return [];
  const now = Date.now();
  return Array.from({ length: limit }, (_, index) => {
    const common = { id: `${service.id}-${index}`, serviceId: service.id, collectedAt: new Date(now - index * 30_000).toISOString() };
    if (service.status === 'indisponivel' && index < 10) {
      return { ...common, status: 'erro', cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, errorMessage: 'Serviço indisponível (HTTP 500).' };
    }
    const cpu = (service.cpu ?? 30) * (1 + (Math.random() - 0.5) * 0.3);
    return {
      ...common,
      status: 'ok',
      cpuPercent: Number(Math.min(100, cpu).toFixed(1)),
      memoryGb: Number((1 + Math.random() * 0.2).toFixed(3)),
      diskGb: Number((12 + (limit - index) * 0.01).toFixed(3)),
      networkGb: Number((0.1 + Math.random() * 0.05).toFixed(3)),
      errorMessage: null,
    };
  });
}

/** Data com hora em ISO 8601 (só a data é recusada, como no backend). */
const ISO_WITH_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const MAX_PERIOD_MS = 31 * 24 * 3_600_000;

/**
 * Totais de um período no formato de GET /services/summary (contrato da #175): os ativos coletam a cada 30 s
 * com a energia por hora da lista; indisponível e sem métricas entram só como coletas com falha.
 * `scale` deixa o período anterior um pouco diferente, para a variação aparecer.
 */
function periodTotals(fromMs, toMs, scale) {
  const hours = (toMs - fromMs) / 3_600_000;
  const perService = Math.floor((toMs - fromMs) / 30_000);
  const active = SERVICES.filter((service) => service.status === 'ativo');
  if (perService === 0 || SERVICES_SCENARIO === 'vazio') {
    return { collections: 0, failed: 0, notCalculated: 0, energyKwh: null, co2eGrams: null, carbonIntensityGco2ePerKwh: null };
  }
  const energyKwh = active.reduce((sum, service) => sum + service.kwh * hours * scale, 0);
  const co2eGrams = active.reduce((sum, service) => sum + service.kwh * hours * scale * service.gramsPerKwh, 0);
  return {
    collections: perService * SERVICES.length,
    failed: perService * (SERVICES.length - active.length),
    notCalculated: 0,
    energyKwh: Number(energyKwh.toFixed(6)),
    co2eGrams: Number(co2eGrams.toFixed(3)),
    // Média das coletas calculadas: cada ativo tem o mesmo número de coletas
    carbonIntensityGco2ePerKwh: Number((active.reduce((sum, service) => sum + service.gramsPerKwh, 0) / active.length).toFixed(1)),
  };
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const routes = {
  // US01 / US04 — serviços monitorados (rota pública do dashboard)
  'GET /services': async (_req, res) => {
    if (SERVICES_SCENARIO === 'erro') return send(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'Falha simulada no backend falso.' } });
    const services = SERVICES_SCENARIO === 'vazio' ? [] : SERVICES.map(readService);
    return send(res, 200, { services, period: 'última 1 hora' });
  },

  // Detalhes do serviço — histórico de coletas (mesmos erros de docs/api.md § GET /api/collections)
  'GET /collections': async (req, res) => {
    const query = new URL(req.url ?? '/', `http://localhost:${PORT}`).searchParams;
    const limit = query.get('limit') ?? '50';
    if (!/^[1-9]\d*$/.test(limit) || Number(limit) > 500) {
      return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'limit deve ser inteiro entre 1 e 500.' } });
    }
    const service = SERVICES.find((item) => item.id === query.get('service_id'));
    if (!service) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Serviço não encontrado.' } });
    return send(res, 200, { collections: serviceCollections(service, Number(limit)), period: { from: null, to: null } });
  },

  // US04 / #175 — indicadores agregados do período (contrato combinado na issue #175)
  'GET /services/summary': async (req, res) => {
    if (SERVICES_SCENARIO === 'erro') return send(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'Falha simulada no backend falso.' } });
    const query = new URL(req.url ?? '/', `http://localhost:${PORT}`).searchParams;
    const from = query.get('from') ?? '';
    const to = query.get('to') ?? '';
    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    if (!ISO_WITH_TIME.test(from) || !ISO_WITH_TIME.test(to) || Number.isNaN(fromMs) || Number.isNaN(toMs) || toMs <= fromMs || toMs - fromMs > MAX_PERIOD_MS) {
      return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Informe from e to (ISO 8601 com hora), com to depois de from e até 31 dias.' } });
    }
    const previousFromMs = fromMs - (toMs - fromMs);
    const list = SERVICES_SCENARIO === 'vazio' ? [] : SERVICES;
    const count = (status) => list.filter((service) => service.status === status).length;
    return send(res, 200, {
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
      totals: periodTotals(fromMs, toMs, 1),
      previous: { from: new Date(previousFromMs).toISOString(), to: new Date(fromMs).toISOString(), totals: periodTotals(previousFromMs, fromMs, 0.92) },
      servicesByStatus: { ativo: count('ativo'), indisponivel: count('indisponivel'), sem_metricas: count('sem_metricas'), removido: count('removido'), total: list.length },
    });
  },
};

createServer(async (req, res) => {
  // CORS: o Vite roda em outra porta (5173)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return send(res, 204);

  // Aceita as rotas com ou sem o prefixo /api (o .env.example usa VITE_API_URL=http://localhost:3000/api)
  const path = new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname.replace(/^\/api(?=\/)/, '');
  const route = routes[`${req.method} ${path}`];
  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method} ${path}`);

  if (!route) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Rota não existe no backend falso.' } });
  return route(req, res);
}).listen(PORT, () => {
  console.log(`Backend falso em http://localhost:${PORT}`);
  console.log(`GET /services: cenário "${SERVICES_SCENARIO}" (MOCK_SERVICES=normal|vazio|erro)`);
});
