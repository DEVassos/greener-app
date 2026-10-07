# `frontend` — GreenER

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React + TypeScript (Vite), react-router e Tailwind CSS.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público), `/login` e `/configuracao` (área restrita, com `ProtectedRoute`); envolve tudo no `AuthProvider` |
| `src/pages/` | telas (`DashboardPage`, `LoginPage`, `SettingsPage`), cada uma com o seu `.css` |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `FormField`, `AuthLayout`, `ProtectedRoute`, `MetricTile`, `KpiPanel`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, `Authorization: Bearer`, erros → `ApiError`), `auth.service.ts`, `settings.service.ts` (`GET /monitoring-settings`, rota privada), `services.service.ts` (`GET /services`); `demo-data.ts` com os dados ilustrativos do modo demonstração |
| `src/contexts/` · `src/providers/` | `AuthContext` e `AuthProvider`: sessão (JWT no `sessionStorage`), login e logout |
| `src/hooks/` | `useAuth`, `useMonitoringSettings`, `useServices` (busca, estados de carregando/erro e tentar novamente) |
| `mock/server.mjs` | **backend falso** só para desenvolvimento e revisão (ver abaixo); não vai para produção |
| `src/utils/` | funções puras: validação de formulário, formatação pt-BR (`format.ts`) e totais dos KPIs (`summary.ts`) |
| `src/styles/global.css` | tokens de cor e fonte do design system, Tailwind e reset |

## Variáveis de ambiente

Lidas do `.env` da **raiz** do repositório (modelo em `.env.example`; `envDir: '..'` no `vite.config.ts`).

| Variável | Obrigatória | Padrão (`.env.example`) | Descrição |
|---|---|---|---|
| `VITE_API_URL` | não | `http://localhost:3000` | base da API do backend. **Sem ela o frontend roda em modo demonstração** (dados ilustrativos e faixa de aviso no topo) |

## Autenticação

- `POST /auth/login` devolve o JWT; o `AuthProvider` guarda no `sessionStorage` (some ao fechar a aba).
- Toda chamada feita por `services/api.ts` com sessão aberta leva `Authorization: Bearer <token>`.
- Resposta 401 com sessão aberta → logout e redirecionamento para `/login`.
- `/configuracao` sem sessão → `/login`, e depois do login volta para `/configuracao`.
- O guarda de rota só melhora a navegação: **quem protege os dados é o backend**.

## Backend falso (`npm run mock`)

Enquanto a API real não existe, `mock/server.mjs` (Node puro, sem dependências) responde em `http://localhost:3000` o **contrato provisório** que o frontend espera. É a referência para o backend implementar as rotas de verdade; quando elas existirem em `docs/api.md`, o contrato aqui é ajustado.

| Rota | Pedido | Resposta |
|---|---|---|
| `POST /auth/login` | `{ "email", "password" }` | `200 { "token" }` · `401 { "message" }` credencial errada · `400` corpo inválido |
| `GET /monitoring-settings` | `Authorization: Bearer <token>` | `200 { "collectIntervalSeconds", "carbonApiUrl" }` · `401` sem token ou token inválido |

- Login do mock: `admin@greener.dev` / `greener123` (no backend real o usuário vem do seed, DB-03).
- Reiniciar o mock invalida os tokens emitidos — serve para testar o 401.
- O terminal do mock mostra cada requisição e se ela chegou "(com Bearer)".

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
2. Na raiz, `cp .env.example .env`. Em um terminal `npm run mock`; em outro `npm run dev` e abrir http://localhost:5173 → dashboard com o cabeçalho e o botão **Entrar**.
3. Clicar em **Configuração** sem sessão → vai para `/login`.
4. Enviar o login vazio → mensagens de erro nos campos.
5. Logar com senha errada → aviso "E-mail ou senha incorretos." (401 do backend).
6. Logar com `admin@greener.dev` / `greener123` → volta para `/configuracao` e mostra os parâmetros; no terminal do mock aparece `GET /monitoring-settings (com Bearer)`.
7. Reiniciar o mock (Ctrl+C e `npm run mock`) e recarregar `/configuracao` → o token antigo recebe 401, a sessão é encerrada e a tela volta para `/login`.
8. Logar de novo e clicar em **Sair** na Configuração → a sessão some e a tela vai para `/login`; no dashboard, **Sair** mantém a página e o botão **Entrar** volta.
9. Parar o mock e tentar logar → aviso "Não foi possível conectar ao servidor".
