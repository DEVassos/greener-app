# `frontend` — GreenER

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React + TypeScript (Vite), react-router e Tailwind CSS.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público), `/login` e `/configuracao` (área restrita, com `ProtectedRoute`); envolve tudo no `AuthProvider` |
| `src/pages/` | telas (`DashboardPage`, `LoginPage`, `SettingsPage`), cada uma com o seu `.css` |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `FormField`, `AuthLayout`, `ProtectedRoute`, `MetricTile`, `KpiPanel`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, `Authorization: Bearer`, erros → `ApiError`), `auth.service.ts`, `services.service.ts` (`GET /services`); `demo-data.ts` com os dados ilustrativos do modo demonstração |
| `src/contexts/` · `src/providers/` | `AuthContext` e `AuthProvider`: sessão (JWT no `sessionStorage`), login e logout |
| `src/hooks/` | `useAuth`, `useServices` (busca, estados de carregando/erro e tentar novamente) |
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
```

## Como verificar este módulo isoladamente

1. `npm ci && npm run build` → termina sem erros de TypeScript.
2. `npm run dev` e abrir http://localhost:5173 → dashboard com o cabeçalho e o botão **Entrar**.
3. Clicar em **Configuração** sem sessão → vai para `/login`.
4. Enviar o login vazio → mensagens de erro nos campos; com o backend fora do ar → aviso "Não foi possível conectar ao servidor".
5. Com o backend no ar (BE-07), logar com o usuário do seed → volta para `/configuracao`; **Sair** encerra a sessão.
