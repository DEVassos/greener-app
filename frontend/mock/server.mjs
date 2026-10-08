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

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const routes = {
  // US01 / US04 — serviços monitorados (rota pública do dashboard)
  'GET /services': async (_req, res) => {
    if (SERVICES_SCENARIO === 'erro') return send(res, 500, { message: 'Falha simulada no backend falso.' });
    const services = SERVICES_SCENARIO === 'vazio' ? [] : SERVICES.map(readService);
    return send(res, 200, { services, period: 'última 1 hora' });
  },
};

createServer(async (req, res) => {
  // CORS: o Vite roda em outra porta (5173)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return send(res, 204);

  const path = new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname;
  const route = routes[`${req.method} ${path}`];
  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method} ${path}`);

  if (!route) return send(res, 404, { message: 'Rota não existe no backend falso.' });
  return route(req, res);
}).listen(PORT, () => {
  console.log(`Backend falso em http://localhost:${PORT}`);
  console.log(`GET /services: cenário "${SERVICES_SCENARIO}" (MOCK_SERVICES=normal|vazio|erro)`);
});
