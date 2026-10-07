// Backend FALSO, só para desenvolvimento e revisão do frontend enquanto a API real não existe.
// Implementa o contrato provisório que o frontend espera (frontend/README.md § Backend falso).
// Não vai para produção nem para o compose: quem implementa as rotas de verdade é o backend (BE-07, BE-02).
//
// Uso: npm run mock  →  http://localhost:3000  (com VITE_API_URL=http://localhost:3000 no .env da raiz)

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT ?? 3000);

/** Usuário administrador do mock (no backend real ele vem do seed, DB-03). */
const ADMIN = { email: 'admin@greener.dev', password: 'greener123' };

/** Tokens emitidos desde que o mock subiu. Reiniciar o mock invalida todos (bom para testar o 401). */
const validTokens = new Set();

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null; // corpo inválido: a rota responde 400
  }
}

/** Token do cabeçalho Authorization: Bearer <token>, ou null. */
function bearerToken(req) {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

const routes = {
  // US07 / BE-07 — login do administrador
  'POST /auth/login': async (req, res) => {
    const body = await readJson(req);
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      return send(res, 400, { message: 'Informe e-mail e senha.' });
    }
    if (body.email.trim().toLowerCase() !== ADMIN.email || body.password !== ADMIN.password) {
      return send(res, 401, { message: 'E-mail ou senha incorretos.' });
    }
    const token = `mock.${randomUUID()}`;
    validTokens.add(token);
    return send(res, 200, { token });
  },

  // US07 — rota da área de configuração: só responde com token válido
  'GET /monitoring-settings': async (req, res) => {
    const token = bearerToken(req);
    if (!token || !validTokens.has(token)) {
      return send(res, 401, { message: 'Token ausente ou inválido.' });
    }
    return send(res, 200, { collectIntervalSeconds: 60, carbonApiUrl: 'https://carbon.unilaunch.org' });
  },
};

createServer(async (req, res) => {
  // CORS: o Vite roda em outra porta (5173)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return send(res, 204);

  const path = new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname;
  const route = routes[`${req.method} ${path}`];
  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method} ${path}${bearerToken(req) ? '  (com Bearer)' : ''}`);

  if (!route) return send(res, 404, { message: 'Rota não existe no backend falso.' });
  return route(req, res);
}).listen(PORT, () => {
  console.log(`Backend falso em http://localhost:${PORT}`);
  console.log(`Login: ${ADMIN.email} / ${ADMIN.password}`);
});
