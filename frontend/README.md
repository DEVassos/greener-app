# `frontend` — GreenER

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React + TypeScript (Vite), react-router e Tailwind CSS.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público) e `/configuracao` (área restrita) |
| `src/pages/` | telas (`DashboardPage`, `SettingsPage`), cada uma com o seu `.css` |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `ServicesTable`, `StatusBadge`, `LastUpdated`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, erros → `ApiError`), `services.service.ts` (`GET /services`); `demo-data.ts` com os dados ilustrativos do modo demonstração |
| `src/hooks/` | `useServices` (busca, estados de carregando/erro e tentar novamente) |
| `src/utils/` | funções puras: formatação pt-BR (`format.ts`) |
| `src/styles/global.css` | tokens de cor e fonte do design system, Tailwind e reset |
| `mock/server.mjs` | **backend falso** só para desenvolvimento e revisão (ver abaixo); não vai para produção |

## Variáveis de ambiente

Lidas do `.env` da **raiz** do repositório (modelo em `.env.example`; `envDir: '..'` no `vite.config.ts`).

| Variável | Obrigatória | Padrão (`.env.example`) | Descrição |
|---|---|---|---|
| `VITE_API_URL` | não | `http://localhost:3000` | base da API do backend. **Sem ela o frontend roda em modo demonstração** (dados ilustrativos e faixa de aviso no topo) |

## Backend falso (`npm run mock`)

Enquanto a API real não existe, `mock/server.mjs` (Node puro, sem dependências) responde em `http://localhost:3000` o **contrato provisório** que o frontend espera. É a referência para o backend implementar a rota de verdade; quando ela existir em `docs/api.md`, o contrato aqui é ajustado.

| Rota | Pedido | Resposta |
|---|---|---|
| `GET /services` | — | `200 { "services": [...], "period" }` (campos em `src/services/services.types.ts`); CPU e energia variam a cada chamada |

- `MOCK_SERVICES=vazio` ou `MOCK_SERVICES=erro` faz `GET /services` devolver lista vazia ou HTTP 500 (Git Bash: `MOCK_SERVICES=vazio npm run mock`; PowerShell: `$env:MOCK_SERVICES='vazio'; npm run mock`).
- O terminal do mock mostra cada requisição recebida.

## Estilos

- Os tokens de `docs/identidade-visual.md` ficam em `:root` (`src/styles/global.css`) e são a fonte única das cores.
- O Tailwind expõe os mesmos tokens como classes: `bg-surface`, `text-muted`, `border-border`, `text-primary`, `text-warning`, `text-error`, `font-display`. A paleta padrão do Tailwind (`slate-950`, `emerald-500`…) também está disponível.
- O preflight (reset) do Tailwind fica desligado para não alterar os componentes que já têm CSS próprio.

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
2. Sem `.env`: `npm run dev` e abrir http://localhost:5173 → faixa "demonstração com dados ilustrativos" e a tabela **Serviços monitorados** com 7 serviços.
3. Na raiz, `cp .env.example .env`. Em um terminal `npm run mock`; em outro `npm run dev` → a faixa some e a tabela mostra os serviços de `GET /services` (o terminal do mock registra a chamada).
4. Na tabela: cada serviço aparece com região, cidade/país e status (Ativo, Indisponível, Sem métricas); sem métrica aparece "—".
5. Digitar "check" na busca → só **Checkout Worker**; buscar algo inexistente → "Nenhum serviço com … no nome".
6. Clicar nos títulos das colunas (Serviço, CPU, Energia, Emissão, Última leitura) → ordena; clicar de novo inverte; serviços sem métrica ficam sempre no fim.
7. Largura de celular → a tabela rola na horizontal sem quebrar a página.
8. `MOCK_SERVICES=vazio npm run mock` e recarregar → "Nenhum serviço monitorado ainda".
9. `MOCK_SERVICES=erro npm run mock` e recarregar → aviso de erro com **Tentar novamente**.
10. Com dados carregados, o cabeçalho mostra o selo **"Última atualização: dd/mm HH:MM:SS"** com um ponto verde pulsando (sistema ativo); com "reduzir movimento" ligado no sistema, o ponto fica parado.
11. Com o mock no ar, carregar o dashboard e depois subir o mock com `MOCK_SERVICES=erro` e clicar em **Tentar novamente** → os dados continuam na tela e o selo fica laranja: **"Desatualizado desde …"**.
