# `frontend` — EcoPulse

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React 19 + TypeScript (Vite 8), react-router e Tailwind CSS 4.

## Requisitos

- Node.js 20.19+ ou 22.12+ (exigência do Vite 8) e npm.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: carrega os estilos globais e monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público), `/emissoes` (emissões por estação, pública), `/comparacao` (comparação entre serviços, pública) e `/configuracao` (configuração do monitoramento; a proteção por login é escopo da #25); envolve tudo no `MonitoringProvider` |
| `src/pages/` | telas (`DashboardPage`, `EmissionsPage`, `ComparePage`, `SettingsPage`) |
| `src/components/` | componentes reutilizáveis e sem HTTP (`AppHeader`, `Brand`, `KpiPanel`, `MetricTile`, `ServicesTable`, `ServiceDetailsDialog`, `CollectionsHistoryTable`, `CpuHistoryChart`, `StatusBadge`, `LastUpdated`, `MissingValue`, `LoadingState`, `ErrorState`, `EmptyState`), com `.css` próprio ou classes do Tailwind |
| `src/services/` | **único lugar com HTTP**: `api.ts` (cliente base, `VITE_API_URL`, erros → `ApiError`), `services.service.ts` (`GET /services`), `collections.service.ts` (`GET /collections` de um serviço), `emissions.service.ts` (série de emissões: `GET /collections` e `GET /collections/series`, com conferência da resposta), `compare.service.ts` (`GET /services/compare`); `demo-data.ts` e `emissions.demo.ts` com os dados ilustrativos do modo demonstração |
| `src/contexts/` · `src/providers/` | `MonitoringContext`/`MonitoringProvider`: intervalo da atualização automática |
| `src/hooks/` | `useMonitoring`, `usePolling` (atualização periódica sem recarregar a página), `useServices` (lista de serviços com polling, erro e atualizar agora), `useCollections` (histórico de coletas de um serviço, com o mesmo polling), `useEmissions` (série de emissões, com tempo real opcional), `useComparison` (comparação entre serviços, uma busca por filtro) |
| `src/utils/` | funções puras: formatação pt-BR (`format.ts`), contagem dos serviços por estado (`summary.ts`), trechos do gráfico da CPU (`cpu-chart.ts`) e datas do filtro, agrupamento, resumo e formatação das emissões (`emissions.ts`) |
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

## Cards de estado

- Acima da tabela, `KpiPanel` mostra quatro cards `MetricTile`: **Total**, **Ativos**, **Indisponíveis** e **Sem métricas**. As contagens vêm de `summarizeStatus` (`src/utils/summary.ts`), sobre a mesma lista de `GET /api/services` da tabela, e mudam no mesmo ciclo do polling.
- Os removidos não entram no total, porque saíram da lista do agregador. Quando há algum, o card do total diz "sem contar N removidos".
- Cada estado tem rótulo, ícone e a cor do `StatusBadge`: a cor nunca é a única pista. A cor só aparece com contagem maior que zero; com zero, o card fica neutro e sem nota, para não criar falso alarme. Com contagem, a nota ao lado do número dá a proporção ("14% do total").
- Os cards são compactos (cerca de 89 px de altura), para sobrar espaço para a tabela em telas de notebook.
- Os cards só aparecem depois da primeira busca bem-sucedida: sem dados, a tela mostra o carregamento ou o erro, nunca zeros. Se uma atualização falha, eles continuam com o último dado, com os números apagados (`--muted`), junto com o erro e o selo "Desatualizado desde…".
- `MetricTile` é genérico (rótulo, valor, unidade, nota, ícone e tom), para os cards de energia e CO₂e do painel de indicadores agregados.

## Energia e emissão na tabela

- As colunas "Energia (kWh)" e "Emissão (g CO₂e)" mostram o resultado da **última coleta** de cada serviço (cerca de 30 s de operação), calculado pelo backend desde o #139. Sem cálculo disponível (por exemplo, com a API de carbono fora), aparece "—", nunca zero.
- A energia sai com 4 casas e a emissão com 1 casa decimal. Por isso, emissões abaixo de 0,05 g por coleta, comuns em regiões de matriz limpa, aparecem como **0,0**; o valor exato está em `GET /api/services`. A formatação será revista na Sprint 2.

## Página Emissões (#190)

- **Emissões**, no menu do topo, abre `/emissoes`: a emissão estimada de CO₂e de uma estação (serviço) ao longo do tempo. A estação e o período ficam na URL (`/emissoes?servico=<id>&de=<AAAA-MM-DD>&ate=<AAAA-MM-DD>`), então o link abre no mesmo filtro e o "voltar" do navegador desfaz a última troca. Sem `servico`, abre na primeira estação. `de` inválida ou no futuro cai em hoje; `ate` inválida, no futuro, antes de `de` ou a mais de 31 dias dela vale como o mesmo dia de `de` (são os casos que o formulário recusa).
- O período vai de 00:00 da data inicial até 24:00 da final (ou até agora, se for hoje), no fuso do navegador, que aparece no subtítulo: "horário de Brasília" em `America/Sao_Paulo`; nos outros fusos, o deslocamento do UTC naquele dia (ex.: "UTC−4"). Por isso o dia 23/10 em Brasília é pedido como `from=2026-10-23T03:00:00.000Z`.
- Filtros: estação, datas (até 31 dias), ◀ ▶ (período anterior/seguinte, do mesmo tamanho), **Atualizar**, **Tempo real** (período de hoje, buscado de novo no intervalo do `MonitoringProvider` e pausado com a aba oculta) e **Agrupar por**.
- Agrupamento automático pelo tamanho do período: até 2 h, **cada coleta**, por `GET /api/collections` (#188, paginado de 500 em 500); até 1 dia, **15 min**; mais que isso, **1 hora**, por `GET /api/collections/series` (#189), que soma no banco. A pessoa pode trocar.
- Resumo: emissão e energia no período, média por coleta calculada, pico de uma coleta (com horário e quantas vezes a média), intensidade da região e coletas (com falha, sem cálculo e tempo sem coleta), mais a **Leitura do período** em frases. Sem cálculo, os valores aparecem como "—", nunca zero.
- **Intensidade da região** é a média da intensidade das coletas calculadas no período, a regra de `totals.carbonIntensityGco2ePerKwh` da #189. Em **Cada coleta** a página faz a mesma média com as coletas recebidas, então o card não muda com o agrupamento.
- **Tempo sem coleta** (no card **Coletas** e na Leitura do período) soma os trechos sem nenhuma coleta registrada, com falha ou não, entre a primeira e a última coleta do período. O tempo antes da primeira e depois da última não conta, porque pode ser só o sistema desligado ou o período ainda em curso. Os trechos têm 15 min em períodos de até 1 dia e 1 hora nos maiores (ou no agrupamento por 1 hora), alinhados como o `date_bin` da #189; assim, **Cada coleta** e **15 min** dão o mesmo número. É ausência de registro, não indisponibilidade.
- O selo `LastUpdated` do cartão mostra "Última atualização: dd/mm HH:MM:SS" (com o intervalo, no **Tempo real**). Se uma busca falha, o resumo e a Leitura do período continuam com o último dado, com os números apagados (`--muted`), junto com o erro, **Tentar novamente** e o selo laranja "Desatualizado desde …", como no dashboard. Se a primeira busca do filtro falha, o selo fica em "Aguardando a primeira atualização" e só aparece o erro. Trocar a estação, o período ou o agrupamento limpa o resumo, o horário e o erro anteriores.
- A resposta é conferida em tempo de execução: envelope fora do formato vira erro amigável; item fora do formato fica de fora e a tela avisa quantos.
- O gráfico entra num segundo PR da #190.

## Comparação entre serviços (#194)

- **Comparação**, no menu do topo, abre `/comparacao`: de 2 a 10 serviços no mesmo período (até 31 dias), por `GET /api/services/compare` (#193). Serviços e datas ficam na URL (`/comparacao?servicos=<id>,<id>&de=<AAAA-MM-DD>&ate=<AAAA-MM-DD>`); as datas seguem as regras da página Emissões, e ids que não estão na lista de serviços são ignorados.
- Uma coluna por serviço e uma linha por métrica: coletas (com falha e sem cálculo), CPU, memória, disco e rede médios, energia (kWh) e CO₂e (g) somados no período. O menor CO₂e fica destacado, com texto e cor, quando ao menos dois serviços têm cálculo. O período ecoado pela API aparece acima da tabela.
- Serviço sem coletas no período aparece como "sem coletas", e as métricas como "—", nunca zero. Com menos de dois serviços, a tela explica o que falta e não busca.
- Uma busca por filtro, sem polling. Se ela falha, aparece só o erro com **Tentar novamente**, sem a comparação anterior.
- O backend falso (`npm run mock`) não tem a rota: use o modo demonstração ou o backend real.

## Detalhes e histórico do serviço

- Clicar numa linha da tabela abre `ServiceDetailsDialog`, um `<dialog>` nativo aberto com `showModal()`. Pelo teclado, o nome do serviço é um botão. O `<dialog>` já prende o foco na janela, fecha com Esc e escurece o fundo; ela fecha também pelo botão × ou por um clique fora, e o foco volta para a tabela.
- A janela mostra os dados da linha (status, região, cidade/país, última leitura, CPU) e as 50 coletas mais recentes de `GET /collections?service_id=<id>&limit=50`, da mais recente para a mais antiga, com o período exibido na legenda.
- Acima da tabela, `CpuHistoryChart` desenha a CPU (%) dessas coletas numa linha, da mais antiga para a mais recente, com eixo de 0 a 100% e os horários de início e fim. É SVG puro, sem biblioteca, e o componente recebe as coletas por props, sem HTTP. A linha é interrompida nas coletas com erro (×) ou sem métricas (anel), marcadas abaixo do eixo e contadas na legenda. Passar o mouse, tocar ou usar as setas, Home e End com o gráfico em foco mostra o valor, o horário e o erro de cada coleta. Com menos de 2 coletas com CPU, aparece um texto no lugar do gráfico. A lógica dos trechos fica em `src/utils/cpu-chart.ts`.
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
| `GET /api/collections` | `service_id` (id do serviço no mock, ex.: `fraud-detector`), `limit` (1 a 500; padrão 50) e `from`/`to` opcionais (ISO 8601 com hora) | `200 { "collections": [...], "period" }` (campos em `src/services/collections.types.ts`, com os de cálculo da #188), uma coleta a cada 30 s até `to` (padrão: agora), com números fixos por horário; serviço indisponível tem as 10 mais recentes com erro e serviço sem métricas devolve lista vazia; `service_id` desconhecido → 404, `limit` inválido → 400 |
| `GET /api/collections/series` | `service_id`, `from`, `to` (ISO 8601 com hora, até 31 dias) e `bucket` (`15min`, `1h` ou `1d`) | `200 { serviceId, from, to, bucket, buckets: [...], totals }` (contrato da #189), com as mesmas coletas da rota acima somadas por intervalo e `totals.carbonIntensityGco2ePerKwh` como média das coletas calculadas; período fechado em `from` e aberto em `to`; parâmetro inválido → 400, serviço desconhecido → 404 |

- `MOCK_SERVICES=vazio` ou `MOCK_SERVICES=erro` faz `GET /api/services` devolver lista vazia ou HTTP 500 com `{ "error": { "code", "message" } }`, o formato de erro do backend (Git Bash: `MOCK_SERVICES=vazio npm run mock`; PowerShell: `$env:MOCK_SERVICES='vazio'; npm run mock`).
- O terminal do mock mostra cada requisição recebida.

## Estilos (Tailwind CSS)

- **Tailwind CSS 4.3**, integrado pelo plugin `@tailwindcss/vite` em `vite.config.ts`. Não há `tailwind.config.js`: a configuração fica no próprio `global.css`.
- Os tokens de [`docs/identidade-visual.md`](../docs/identidade-visual.md) ficam em `:root` (`src/styles/global.css`) e são a fonte única das cores.
- O Tailwind expõe os mesmos tokens como classes (`@theme inline`): `bg-surface`, `text-muted`, `border-border`, `text-primary`, `text-primary-hover`, `text-warning`, `text-error`, `text-danger`, `font-display`. Use só essas classes de token: a paleta padrão do Tailwind (`slate-950`, `emerald-500`…) continua no build, mas não entra nos componentes, para as cores seguirem o guia (#180). Exemplo:

  ```tsx
  <section className="panel p-6">
    <h1 className="font-display text-2xl text-text">Configuração</h1>
    <p className="text-sm text-muted">Texto de apoio em --muted.</p>
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
10. Com dados carregados, o cabeçalho mostra o selo **"Última atualização: dd/mm HH:MM:SS"** com um ponto verde pulsando (sistema ativo); com "reduzir movimento" ligado no sistema, o ponto fica parado. A cada horário novo no selo, o logo pulsa uma vez: a folha vira uma linha de batimento com brilho neon e volta (cerca de 2,4 s). Ele não pulsa quando a atualização falha, em **Configuração** (sem polling) nem com "reduzir movimento", e dois cliques seguidos em **Atualizar agora** não reiniciam o pulso no meio.
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
22. Na janela de **Fraud Detector**, acima da tabela → gráfico **CPU (%)** com eixo de 0 a 100% e os horários da primeira e da última coleta da legenda; "última" é a CPU da primeira linha da tabela. Passar o mouse sobre o gráfico → linha vertical e caixa com a CPU e o horário da coleta mais próxima, iguais aos da tabela. Com Tab até o gráfico, as setas, Home e End percorrem as coletas.
23. Na janela de **Email Dispatcher** → a linha para onde começam os erros, as coletas com erro aparecem como × abaixo do eixo e a legenda diz "A linha é interrompida nas coletas sem CPU: N com erro". Com o cursor sobre um ×, a caixa mostra "Erro na coleta" e a observação da coleta.
24. Com 375 px de largura → o gráfico ocupa a largura da janela, sem rolagem lateral, e os rótulos continuam legíveis.
25. Sem `.env` → acima da tabela, os cards mostram **Total 7**, **Ativos 5** (71% do total), **Indisponíveis 1** e **Sem métricas 1** (14% do total cada), em verde, vermelho e laranja, as mesmas contagens da coluna Status. Com 375 px, ficam em 2 colunas, sem rolagem lateral.
26. Com o backend real: `curl -s http://localhost:3000/api/services | jq '.services | group_by(.status) | map({(.[0].status): length}) | add'` → cada card bate com a contagem do seu status, e o total é a soma sem os `removido`. Com todos ativos, **Indisponíveis** e **Sem métricas** mostram 0 sem cor e sem nota.
27. Com o dashboard aberto, `docker compose stop backend` e esperar um intervalo → os cards continuam com os últimos números, apagados, com o erro e o selo "Desatualizado desde…". Recarregar a página com o backend parado → nenhum card, só o erro. `docker compose start backend` → no ciclo seguinte, os cards e o selo voltam ao normal.
28. Sem `.env`, clicar em **Emissões** no menu → abre `/emissoes`, sem parâmetros na URL, na primeira estação (**Fraud Detector**), com hoje, "Automático (15 min)" e o resumo do dia; a URL só ganha `?servico=…` ao trocar a estação. **Email Dispatcher** mostra coletas "com falha" no card **Coletas** (as dos últimos 21 min). **Inventory Sync** mostra todas as coletas com falha ("N · N com falha"), "—" em emissão, energia, média, pico e intensidade, e o aviso "Há coletas no período, mas nenhuma com emissão calculada…": o modo demonstração registra as coletas desse serviço com falha, como o backend real faz com as coletas `sem_metricas`.
29. Trocar a estação e clicar em ◀ → a URL muda (`servico`, `de`, `ate`) e o resumo é do dia anterior; o botão voltar do navegador volta ao filtro anterior. Abrir o link copiado numa aba nova → mesmo filtro.
30. Em **Agrupar por**, escolher **Cada coleta** → o total de emissão e de coletas, a intensidade da região e o tempo sem coleta (quando houver) são os mesmos do agrupamento por 15 min; o pico passa a mostrar o horário exato da coleta.
31. Com o mock no ar (`npm run mock`), abrir `/emissoes` → o terminal do mock registra `GET /collections/series`; com **Cada coleta**, registra `GET /collections` (várias páginas para um dia inteiro). **Inventory Sync** → "Nenhuma coleta desta estação no período escolhido" (o backend falso não devolve coletas de serviço sem métricas). Abrir `/emissoes?de=lixo` → cai em hoje. Abrir `/emissoes?servico=fraud-detector&de=2026-08-01&ate=2026-10-20` (81 dias) → abre só 01/08/2026, sem erro.
32. **Tempo real** com `VITE_REFRESH_INTERVAL_MS=5000` → o selo "Última atualização" muda a cada 5 s, com "intervalo: 5 s", e o logo pulsa; trocar de aba pausa as chamadas no terminal do mock.
33. Com o resumo na tela, parar o mock e clicar em **Atualizar** → aparece o erro com **Tentar novamente**, o selo fica laranja ("Desatualizado desde …") e os números do resumo e da Leitura do período ficam apagados. Ainda com o mock parado, trocar a estação → "Aguardando a primeira atualização" e o erro, sem resumo. Subir o mock e clicar em **Tentar novamente** → a tela volta ao normal.
34. O subtítulo do cartão mostra o fuso depois da data: "(horário de Brasília)" com o navegador em `America/Sao_Paulo`. Com outro fuso no sistema (ou no DevTools, em Sensors → Location, campo Timezone ID), mostra o deslocamento, ex.: "(UTC−4)" em Nova York, e o `from` da busca muda junto.
35. Sem `.env`, clicar em **Comparação** no menu → abre `/comparacao` sem serviços marcados e com "Escolha pelo menos dois serviços". Marcar só um e clicar em **Comparar** → "Escolha pelo menos dois serviços para comparar.", sem busca.
36. Marcar **Fraud Detector**, **Reporting Batch** e **Inventory Sync** e clicar em **Comparar** → a URL ganha `servicos`, `de` e `ate`, e a tabela mostra os três lado a lado, com o período escrito acima. **Reporting Batch** aparece com "menor CO₂e", e **Inventory Sync** com todas as coletas com falha e "—" nas métricas. O botão voltar do navegador volta à tela sem escolha.
37. Com o backend real, escolher uma data sem coletas (ex.: anterior à primeira subida do banco) → cada serviço aparece como "sem coletas", sem destaque de menor CO₂e. Parar o backend e clicar em **Comparar** → só o erro com **Tentar novamente**, sem tabela.
38. Com 375 px de largura → a página não ganha rolagem lateral; só a tabela rola na horizontal.
