# `frontend` — GreenER

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React 19 + TypeScript (Vite 8), react-router e Tailwind CSS 4.

## Requisitos

- Node.js 20.19+ ou 22.12+ (exigência do Vite 8) e npm.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: carrega os estilos globais e monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público) e `/configuracao` (configuração do monitoramento; a proteção por login é escopo da #25) |
| `src/pages/` | telas (`DashboardPage`, `SettingsPage`) |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `ServicesTable`, `StatusBadge`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, erros → `ApiError`), `services.service.ts` (`GET /services`); `demo-data.ts` com os dados ilustrativos do modo demonstração |
| `src/hooks/` | `useServices` (busca, estados de carregando/erro e tentar novamente) |
| `src/utils/` | funções puras: formatação pt-BR (`format.ts`) |
| `src/styles/global.css` | ordem das camadas de CSS, Tailwind, tokens de cor e fonte e reset mínimo |
| `src/styles/layout.css` | estrutura comum das páginas (`.page`, `.content`, `.panel`) |
| `mock/server.mjs` | **backend falso** só para desenvolvimento e revisão (ver abaixo); não vai para produção |
| `Dockerfile` · `nginx.conf` · `.dockerignore` | imagem do container (ver [Execução em container](#execução-em-container)) |

## Variáveis de ambiente

Lidas do `.env` da **raiz** do repositório (modelo em `.env.example`; `envDir: '..'` no `vite.config.ts`).

| Variável | Obrigatória | Padrão (`.env.example`) | Descrição |
|---|---|---|---|
| `VITE_API_URL` | não | `http://localhost:3000/api` | base da API do backend, vista pelo navegador. **Sem ela o frontend roda em modo demonstração** (dados ilustrativos e faixa de aviso no topo). No container ela é embutida no bundle durante o build: depois de mudar, suba com `--build` |

## Execução em container

Caminho oficial ([ADR 0003](../docs/adr/0003-docker-compose-unico-caminho.md)); o modo de execução do container está no [ADR 0005](../docs/adr/0005-frontend-nginx-build-producao.md). Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build      # frontend em http://localhost:5173
```

- `Dockerfile` multi-stage: o estágio `build` (`node:24-alpine`) roda `npm ci` e `npm run build`, então **um erro de TypeScript derruba o build da imagem**. O estágio final (`nginxinc/nginx-unprivileged:1.30-alpine`) leva só o `dist/` e roda o nginx sem root, na porta 8080 do container (publicada como 5173).
- `nginx.conf`: rotas desconhecidas devolvem o `index.html` (fallback da SPA, então `/configuracao` funciona ao recarregar); `/assets/*` (arquivos com hash) com cache de um ano; `index.html` sem cache; gzip e cabeçalhos `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`.
- `VITE_API_URL` chega como argumento de build pelo `compose.yaml`, lido do `.env` da raiz. O container do frontend não recebe o `.env` inteiro, então segredos do backend (`JWT_SECRET`, `DATABASE_URL`) não chegam a ele.
- O container tem healthcheck (`wget` em `http://127.0.0.1:8080/`): `docker compose ps` mostra `healthy`.
- Não há recarga automática dentro do container: para desenvolver com recarga continue usando `npm run dev` fora dele (atalho opcional, ver ADR 0005).

## Backend falso (`npm run mock`)

Enquanto a API do backend não existe, `mock/server.mjs` (Node puro, sem dependências) responde em `http://localhost:3000` o **contrato provisório** que o frontend espera, com ou sem o prefixo `/api`. É a referência para o backend implementar a rota de verdade; quando ela estiver documentada, o contrato aqui é ajustado. (`docs/especificacao-api.md` descreve as APIs **externas** — agregador e intensidade de carbono —, não a API do GreenER.)

| Rota | Pedido | Resposta |
|---|---|---|
| `GET /api/services` | — | `200 { "services": [...], "period" }` (campos em `src/services/services.types.ts`); CPU e energia variam a cada chamada |

- `MOCK_SERVICES=vazio` ou `MOCK_SERVICES=erro` faz `GET /api/services` devolver lista vazia ou HTTP 500 com `{ "error": { "code", "message" } }`, o formato de erro do backend (Git Bash: `MOCK_SERVICES=vazio npm run mock`; PowerShell: `$env:MOCK_SERVICES='vazio'; npm run mock`).
- O terminal do mock mostra cada requisição recebida.

## Estilos (Tailwind CSS)

- **Tailwind CSS 4.3**, integrado pelo plugin `@tailwindcss/vite` em `vite.config.ts`. Não há `tailwind.config.js`: a configuração fica no próprio `global.css`.
- Os tokens de [`docs/identidade-visual.md`](../docs/identidade-visual.md) ficam em `:root` (`src/styles/global.css`) e são a fonte única das cores.
- O Tailwind expõe os mesmos tokens como classes (`@theme inline`): `bg-surface`, `text-muted`, `border-border`, `text-primary`, `text-warning`, `text-error`, `font-display`. A paleta padrão do Tailwind (`slate-950`, `emerald-500`…) também está disponível. Exemplo:

  ```tsx
  <section className="panel p-6">
    <h1 className="font-display text-2xl text-primary">Configuração</h1>
  </section>
  ```

- **Preflight desligado:** `global.css` importa só `tailwindcss/theme.css` e `tailwindcss/utilities.css` (e não o `preflight.css`), para o reset do Tailwind não alterar os componentes que têm CSS próprio. O reset mínimo do projeto fica na camada `base`.
- **Camadas:** a prioridade é `theme < base < components < utilities`. O CSS de componentes e de layout fica dentro de `@layer components { … }`, então uma classe utilitária (`p-4`, `text-muted`) sempre vence o CSS do componente. CSS fora de camada venceria as utilities; por isso todo CSS novo entra numa camada.
- `main.tsx` importa `global.css` antes do `App`, porque é ele que declara a ordem das camadas.
- Cor nova entra primeiro no guia (`docs/identidade-visual.md`) e depois como token em `global.css`; nada de valor hexadecimal solto em componente.

## Comandos

```bash
npm ci              # instalar dependências
npm run dev         # desenvolvimento com recarga (http://localhost:5173)
npm run typecheck   # checagem de tipos (tsc --noEmit)
npm run build       # checagem de tipos + build de produção em dist/
npm run preview     # serve o build de produção
npm run mock        # backend falso em http://localhost:3000 (desenvolvimento)
```

## Como verificar este módulo isoladamente

1. `npm ci && npm run build` → termina sem erros de TypeScript.
2. Sem `.env`: `npm run dev` e abrir http://localhost:5173 → faixa "demonstração com dados ilustrativos" e a tabela **Serviços monitorados** com 7 serviços; o link **Configuração** abre `/configuracao`.
3. Estreitar a janela para menos de 960 px (ou usar o modo dispositivo do navegador) → o menu continua visível, numa segunda linha abaixo da marca, e a tabela rola na horizontal sem quebrar a página.
4. Na raiz, `cp .env.example .env`. Em um terminal `npm run mock`; em outro `npm run dev` → a faixa some e a tabela mostra os serviços de `GET /api/services` (o terminal do mock registra a chamada).
5. Na tabela: cada serviço aparece com região, cidade/país e status (Ativo, Indisponível, Sem métricas); sem métrica aparece "—".
6. Digitar "check" na busca → só **Checkout Worker**; buscar algo inexistente → "Nenhum serviço com … no nome".
7. Clicar nos títulos das colunas (Serviço, CPU, Energia, Emissão, Última leitura, Localização, Status) → ordena; clicar de novo inverte; serviços sem métrica ficam sempre no fim. Localização ordena pela região (depois país e cidade); Status começa pelo mais grave (Indisponível, Sem métricas, Ativo, Removido).
8. `MOCK_SERVICES=vazio npm run mock` e recarregar → "Nenhum serviço monitorado ainda".
9. `MOCK_SERVICES=erro npm run mock` e recarregar → aviso "Falha simulada no backend falso." (a mensagem vem do corpo do erro) com **Tentar novamente**.
10. Na raiz, `docker compose up --build frontend` → `docker compose ps` mostra o frontend `healthy`; `curl -I http://localhost:5173/configuracao` → `200 OK` (fallback da SPA). Com `npm run mock` rodando no host, http://localhost:5173 mostra a tabela vinda do backend falso.
