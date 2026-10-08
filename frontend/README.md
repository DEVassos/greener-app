# `frontend` — GreenER

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React + TypeScript (Vite), react-router e Tailwind CSS.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público) e `/configuracao` (área restrita); envolve tudo no `MonitoringProvider` |
| `src/pages/` | telas (`DashboardPage`, `SettingsPage`), cada uma com o seu `.css` |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `ServicesTable`, `StatusBadge`, `LastUpdated`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, erros → `ApiError`), `services.service.ts` (`GET /services`); `demo-data.ts` com os dados ilustrativos do modo demonstração |
| `src/contexts/` · `src/providers/` | `MonitoringContext`/`MonitoringProvider`: intervalo da atualização automática |
| `src/hooks/` | `useMonitoring`, `usePolling` (atualização periódica sem recarregar a página), `useServices` (lista de serviços com polling, erro e atualizar agora) |
| `src/utils/` | funções puras: formatação pt-BR (`format.ts`) |
| `src/styles/global.css` | tokens de cor e fonte do design system, Tailwind e reset |
| `mock/server.mjs` | **backend falso** só para desenvolvimento e revisão (ver abaixo); não vai para produção |

## Variáveis de ambiente

Lidas do `.env` da **raiz** do repositório (modelo em `.env.example`; `envDir: '..'` no `vite.config.ts`).

| Variável | Obrigatória | Padrão (`.env.example`) | Descrição |
|---|---|---|---|
| `VITE_API_URL` | não | `http://localhost:3000` | base da API do backend. **Sem ela o frontend roda em modo demonstração** (dados ilustrativos e faixa de aviso no topo) |
| `VITE_REFRESH_INTERVAL_MS` | não | `30000` | intervalo da atualização automática do dashboard (mínimo `5000`) |

## Atualização em tempo real

- `usePolling` busca ao abrir a tela e de novo a cada intervalo, só depois que a busca anterior terminou.
- Com a aba oculta o polling pausa; ao voltar para a aba, busca na hora.
- Ao sair da tela, o timer é limpo e a requisição pendente é cancelada (`AbortController`).
- O cabeçalho mostra "Última atualização: dd/mm HH:MM:SS · intervalo: N s" e o botão **Atualizar agora**.
- Se uma atualização falhar, os dados anteriores continuam na tela, o selo fica laranja ("Desatualizado desde…") e aparece o erro com **Tentar novamente**.

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
12. Com `VITE_REFRESH_INTERVAL_MS=5000` no `.env` e o mock no ar: a cada 5 s o horário do selo muda e o terminal do mock registra um novo `GET /services`; os valores de CPU e energia mudam na tabela **sem recarregar a página**. O selo mostra "intervalo: 5 s".
13. Clicar em **Atualizar agora** (ícone ao lado do selo) → busca na hora, sem esperar o intervalo.
14. Trocar de aba por alguns segundos → o terminal do mock para de registrar chamadas; ao voltar, chega uma chamada imediata.
15. Parar o mock com a tela aberta → na próxima atualização o selo fica laranja ("Desatualizado desde …"), aparece o erro e os dados anteriores continuam; subir o mock de novo → a tela volta ao normal na atualização seguinte.
