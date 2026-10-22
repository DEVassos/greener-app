# `frontend` — EcoPulse

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React 19 + TypeScript (Vite 8), react-router e Tailwind CSS 4.

## Requisitos

- Node.js 20.19+ ou 22.12+ (exigência do Vite 8) e npm.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: carrega os estilos globais e monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público) e `/configuracao` (configuração do monitoramento; a proteção por login é escopo da #25); envolve tudo no `MonitoringProvider` |
| `src/pages/` | telas (`DashboardPage`, `SettingsPage`) |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `ServicesTable`, `ServiceDetailsDialog`, `CollectionsHistoryTable`, `StatusBadge`, `LastUpdated`, `MissingValue`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, erros → `ApiError`), `services.service.ts` (`GET /services`), `collections.service.ts` (`GET /collections` de um serviço); `demo-data.ts` com os dados ilustrativos do modo demonstração |
| `src/contexts/` · `src/providers/` | `MonitoringContext`/`MonitoringProvider`: intervalo da atualização automática |
| `src/hooks/` | `useMonitoring`, `usePolling` (atualização periódica sem recarregar a página), `useServices` (lista de serviços com polling, erro e atualizar agora), `useCollections` (histórico de coletas de um serviço, com o mesmo polling) |
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
| `VITE_REFRESH_INTERVAL_MS` | não | `30000` | intervalo da atualização automática do dashboard (mínimo `5000`; máximo `2147483647`, o limite do `setTimeout`). Como a `VITE_API_URL`, é embutida no bundle no build do container |

## Atualização em tempo real

- `usePolling` busca ao abrir a tela e de novo a cada intervalo, só depois que a busca anterior terminou.
- Com a aba oculta o polling pausa; ao voltar para a aba, busca na hora.
- Ao sair da tela, o timer é limpo e a requisição pendente é cancelada (`AbortController`).
- O cabeçalho mostra "Última atualização: dd/mm HH:MM:SS · intervalo: N s" e o botão **Atualizar agora**; antes da primeira busca bem-sucedida (inclusive se ela falhar), mostra "Aguardando a primeira atualização" com o intervalo e o botão.
- Durante uma busca o botão fica com `aria-disabled` (não `disabled`), para quem navega pelo teclado não perder o foco a cada ciclo. O selo não é `role="status"`: o horário não é anunciado a cada ciclo, e a falha é anunciada pelo aviso de erro.
- Se uma atualização falhar, os dados anteriores continuam na tela, o selo fica laranja ("Desatualizado desde…") e aparece o erro com **Tentar novamente**.

## Energia e emissão na tabela

- As colunas "Energia (kWh)" e "Emissão (g CO₂e)" mostram o resultado da **última coleta** de cada serviço (cerca de 30 s de operação), calculado pelo backend desde o #139. Sem cálculo disponível (por exemplo, com a API de carbono fora), aparece "—", nunca zero.
- A energia sai com 4 casas e a emissão com 1 casa decimal. Por isso, emissões abaixo de 0,05 g por coleta, comuns em regiões de matriz limpa, aparecem como **0,0**; o valor exato está em `GET /api/services`. A formatação será revista na Sprint 2.

## Detalhes e histórico do serviço

- Clicar numa linha da tabela abre `ServiceDetailsDialog`, um `<dialog>` nativo aberto com `showModal()`. Pelo teclado, o nome do serviço é um botão. O `<dialog>` já prende o foco na janela, fecha com Esc e escurece o fundo; ela fecha também pelo botão × ou por um clique fora, e o foco volta para a tabela.
- A janela mostra os dados da linha (status, região, cidade/país, última leitura, CPU) e as 50 coletas mais recentes de `GET /collections?service_id=<id>&limit=50`, da mais recente para a mais antiga, com o período exibido na legenda.
- O histórico usa o mesmo `usePolling` e o mesmo intervalo do dashboard, com selo "Última atualização" próprio. Se uma busca falhar, as coletas anteriores continuam na tela com "Desatualizado desde…" e **Tentar novamente**. Um serviço sem coletas mostra um aviso no lugar da tabela.
- A janela só fica montada enquanto está aberta: fechar cancela o polling do histórico.

## Execução em container

Caminho oficial ([ADR 0003](../docs/adr/0003-docker-compose-unico-caminho.md)); o modo de execução do container está no [ADR 0005](../docs/adr/0005-frontend-nginx-build-producao.md). Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build      # frontend em http://localhost:5173
```

- `Dockerfile` multi-stage: o estágio `build` (`node:24-alpine`) roda `npm ci` e `npm run build`, então **um erro de TypeScript derruba o build da imagem**. O estágio final (`nginxinc/nginx-unprivileged:1.30-alpine`) leva só o `dist/` e roda o nginx sem root, na porta 8080 do container (publicada como 5173).
- `nginx.conf`: rotas desconhecidas devolvem o `index.html` (fallback da SPA, então `/configuracao` funciona ao recarregar); `/assets/*` (arquivos com hash) com cache de um ano; `index.html` sem cache; gzip e cabeçalhos `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`.
- `VITE_API_URL` e `VITE_REFRESH_INTERVAL_MS` chegam como argumentos de build pelo `compose.yaml`, lidos do `.env` da raiz (mudou no `.env`, suba com `--build`). O container do frontend não recebe o `.env` inteiro, então segredos do backend (`JWT_SECRET`, `DATABASE_URL`) não chegam a ele.
- O container tem healthcheck (`wget` em `http://127.0.0.1:8080/`): `docker compose ps` mostra `healthy`.
- Não há recarga automática dentro do container: para desenvolver com recarga continue usando `npm run dev` fora dele (atalho opcional, ver ADR 0005).

## Backend falso (`npm run mock`)

O backend real já expõe `GET /api/services` e `GET /api/collections` (#111, #112), e o caminho oficial é o compose. O `mock/server.mjs` continua como atalho de desenvolvimento sem Docker: (Node puro, sem dependências) responde em `http://localhost:3000` o **contrato provisório** que o frontend espera, com ou sem o prefixo `/api`. É a referência para o backend implementar a rota de verdade; quando ela estiver documentada, o contrato aqui é ajustado. (`docs/especificacao-api.md` descreve as APIs **externas** — agregador e intensidade de carbono —, não a API do EcoPulse.)

| Rota | Pedido | Resposta |
|---|---|---|
| `GET /api/services` | — | `200 { "services": [...], "period" }` (campos em `src/services/services.types.ts`); CPU e energia variam a cada chamada |
| `GET /api/collections` | `service_id` (id do serviço no mock, ex.: `fraud-detector`) e `limit` (1 a 500; padrão 50) | `200 { "collections": [...], "period" }` (campos em `src/services/collections.types.ts`), uma coleta a cada 30 s até agora; serviço indisponível tem as 10 mais recentes com erro e serviço sem métricas devolve lista vazia; `service_id` desconhecido → 404, `limit` inválido → 400 |

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

- **Controles comuns** ficam em `src/styles/controls.css`: `.btn-outline` é o botão vazado das ações secundárias (ex.: **Tentar novamente**, **Atualizar agora**). O verde fica só em ações e destaques, e o `--neon` só no que pede atenção (#180; regras no guia).

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
3. Estreitar a janela para menos de 960 px (ou usar o modo dispositivo do navegador) → o menu continua visível, numa segunda linha abaixo da marca, e só a tabela rola na horizontal: a página não ganha rolagem lateral, nem com energia e emissão vazias (serviço sem cálculo disponível).
4. Na raiz, `cp .env.example .env`. Em um terminal `npm run mock`; em outro `npm run dev` → a faixa some e a tabela mostra os serviços de `GET /api/services` (o terminal do mock registra a chamada como `GET /services`, sem o prefixo `/api`).
5. Na tabela: cada serviço aparece com região, cidade/país e status (Ativo, Indisponível, Sem métricas); sem métrica aparece "—". Localização mostra só as partes informadas (sem ", null"); sem nenhuma, aparece "—" e o serviço fica no fim ao ordenar por Localização. Com o backend real há um quarto status, **Removido**: o serviço saiu da lista de `GET /services` do agregador na última descoberta do worker e volta a Ativo quando reaparece. O backend falso não tem esse caso.
6. Digitar "check" na busca → só **Checkout Worker**; buscar algo inexistente → "Nenhum serviço com … no nome".
7. Clicar nos títulos das colunas (Serviço, CPU, Energia, Emissão, Última leitura, Localização, Status) → ordena; clicar de novo inverte; serviços sem métrica ficam sempre no fim. Localização ordena pela região (depois país e cidade); Status começa pelo mais grave (Indisponível, Sem métricas, Ativo, Removido).
8. `MOCK_SERVICES=vazio npm run mock` e recarregar → "Nenhum serviço monitorado ainda".
9. `MOCK_SERVICES=erro npm run mock` e recarregar → aviso "Falha simulada no backend falso." (a mensagem vem do corpo do erro) com **Tentar novamente**.
10. Com dados carregados, o cabeçalho mostra o selo **"Última atualização: dd/mm HH:MM:SS"** com um ponto verde pulsando (sistema ativo); com "reduzir movimento" ligado no sistema, o ponto fica parado. A cada horário novo no selo, o logo pulsa uma vez: a folha vira uma linha de batimento com brilho neon e volta (cerca de 2,4 s). Ele não pulsa quando a atualização falha, em **Configuração** (sem polling) nem com "reduzir movimento".
11. Com o mock no ar, carregar o dashboard e depois subir o mock com `MOCK_SERVICES=erro` e clicar em **Tentar novamente** → os dados continuam na tela e o selo fica laranja: **"Desatualizado desde …"**.
12. Com `VITE_REFRESH_INTERVAL_MS=5000` no `.env` e o mock no ar: a cada 5 s o horário do selo muda e o terminal do mock registra um novo `GET /services`; os valores de CPU e energia mudam na tabela **sem recarregar a página**. O selo mostra "intervalo: 5 s".
13. Clicar em **Atualizar agora** (ícone ao lado do selo) → busca na hora, sem esperar o intervalo.
14. Trocar de aba por alguns segundos → o terminal do mock para de registrar chamadas; ao voltar, chega uma chamada imediata.
15. Parar o mock com a tela aberta → na próxima atualização o selo fica laranja ("Desatualizado desde …"), aparece o erro e os dados anteriores continuam; subir o mock de novo → a tela volta ao normal na atualização seguinte.
16. Na raiz, `docker compose up --build frontend` → `docker compose ps` mostra o frontend `healthy`; `curl -I http://localhost:5173/configuracao` → `200 OK` (fallback da SPA). Com `npm run mock` rodando no host, http://localhost:5173 mostra a tabela vinda do backend falso.
17. Sem `.env`, clicar na linha de **Fraud Detector** → abre a janela com status, região, cidade/país, última leitura, CPU e a tabela **Histórico de coletas** com 50 coletas, da mais recente para a mais antiga; a legenda mostra o período ("de dd/mm HH:MM:SS a dd/mm HH:MM:SS").
18. Na janela de **Email Dispatcher** → as coletas mais recentes aparecem com status **Erro**, "—" nas métricas e a observação "Serviço indisponível (HTTP 500)."; na de **Inventory Sync** → "Nenhuma coleta registrada para este serviço ainda".
19. Fechar a janela com Esc, com o botão × e com um clique fora → as três formas fecham. Com Tab até o nome de um serviço e Enter → a janela abre; ao fechar, o foco volta para o nome.
20. Com o mock no ar e `VITE_REFRESH_INTERVAL_MS=5000`, abrir um serviço → o terminal do mock registra `GET /collections` a cada 5 s, e o selo da janela e a CPU das coletas mudam sem recarregar. Parar o mock → a janela mostra o erro e "Desatualizado desde …" e mantém as coletas.
21. Estreitar a janela do navegador para 375 px com os detalhes abertos → a página não ganha rolagem lateral; só a tabela do histórico rola na horizontal.
