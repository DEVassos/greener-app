# Backend EcoPulse — setup da API (#8)

Node 20, Express 5, TypeScript estrito, PostgreSQL pelo driver pg e imagem Docker em `node:24-alpine` ([Docker](#docker)). O setup da #8 oferece inicialização e saúde da API; a contribuição local da #14 acrescenta repositories e transações, ainda sem revisão/publicação. Não há CRUD HTTP, ingestão, worker, cálculos, JWT ou auditoria.

## Organização

Baseada no modelo do professor: `src/app.ts` monta Express; `src/server.ts` inicia HTTP; `src/db/connection.ts` gerencia pool único; módulos usam `routes/controller/service/repository`. A contribuição local da #14 implementa o repository no módulo `usuarios` criado por Lucas; seus outros três arquivos permanecem inalterados e sem rotas registradas. `config/env.ts`, `shared/errors.ts` e `middlewares/error-handler.ts` aplicam os padrões do Agilekit. SQL fica somente nos repositories.

O tsconfig mantém ES2022, Node16 para módulo/resolução, strict, rootDir src e outDir dist. Sem type=module, o build emite CommonJS. Testes ficam fora de src.

## Ambiente e execução

| Variável | Padrão | Regra |
|---|---|---|
| PORT | 3000 | inteiro de 1 a 65535 |
| DATABASE_URL | sem padrão | URL postgres/postgresql com host e nome do banco; obrigatória |
| METRICS_API_URL | `https://metrics.unilaunch.org` | URL http(s) da API agregadora de métricas; barra final é removida |

Somente `config/env.ts` lê process.env. Não há leitura automática de `.env`: o ambiente deve ser fornecido ao processo. A #7/#82 mantém o modelo na raiz e a #27 fará a injeção no Compose. JWT e polling não são exigidos pelo setup. Não registre URLs com credenciais em logs.

Caminho oficial: `docker compose up --build`, pelo WSL nesta máquina. A #26 entrega `backend/Dockerfile` e `backend/.dockerignore`; falta a #27 acrescentar os serviços `backend` e `postgres` (volume nomeado e healthcheck) ao `compose.yaml` — até lá o build local é o `docker build` descrito em [Docker](#docker). O host dentro da DATABASE_URL precisa ser o serviço PostgreSQL do Compose, não localhost.

Comandos do módulo, com Node 20 ou superior e ambiente já fornecido (atalhos de desenvolvimento/validação, não substituem Compose):

```bash
cd backend
npm ci
npm run typecheck
npm test
npm run build
npm start
# Alternativa para desenvolvimento com recarga:
npm run dev
```

A imagem fixa `node:24-alpine`, alinhada ao frontend (ADR 0005) e ao modelo do professor; diverge da regra atual do Agilekit, que indica Node 20 — versão fora do suporte oficial. O CI compartilhado usa Node 22. A regra de área precisa ser atualizada pela equipe/SM; a #26 fixa a versão na imagem sem alterar regra ou workflow.

## Docker

`backend/Dockerfile` é multi-stage sobre `node:24-alpine`:

- **build** — `npm ci` pelo `package-lock.json`, cópia de `tsconfig.json` e `src/`, `npm run build` (tsc) e `npm prune --omit=dev`.
- **runtime** — recebe apenas `dist/`, `node_modules` de produção e `package.json`, executa `node dist/server.js` como usuário `node` (não-root) e expõe a porta 3000.

`backend/.dockerignore` mantém fora do contexto `node_modules/`, `dist/`, `coverage/`, `.env*`, `tests/` e os metadados do repositório.

Enquanto a #27 não completa o `compose.yaml`, o build e a execução são feitos diretamente:

```bash
docker build -t greener-backend ./backend

# Banco descartável apenas para validar a saúde da API
docker network create greener-check
docker run -d --name pg-check --network greener-check \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=greener postgres:16-alpine
docker run -d --name api-check --network greener-check -p 3000:3000 \
  -e DATABASE_URL=postgres://postgres:postgres@pg-check:5432/greener greener-backend
curl -i http://localhost:3000/health
```

Esperado: `200` e `{"status":"ok","db":"ok"}`. Encerrar com `docker rm -f api-check pg-check; docker network rm greener-check`.

## API auxiliar: agregador de métricas (#15)

`src/integrations/metrics-api.ts` é o cliente da Greener Metrics Aggregator API (contrato em [`docs/especificacao-api.md`](../docs/especificacao-api.md), seção 1). Ainda não é chamado por nenhuma rota nem pelo coletor: quem o usa é o worker de coleta (#19) e o módulo de serviços (US01).

```ts
const api = createMetricsApi({ baseUrl: env.metricsApiUrl });
const services = await api.listServices();             // ServiceSummary[]
const result = await api.getServiceMetrics('billing-api'); // { status: 'ok', metrics } | { status: 'sem_metricas' } | { status: 'indisponivel' }
```

- **Tipos:** `metrics-api.types.ts` tem os tipos do JSON da API (`Raw*`, snake_case) e os tipos devolvidos ao sistema (camelCase). Toda resposta é validada antes da conversão; formato inesperado não passa adiante.
- **Estados do serviço:** em `GET /metrics/{id}`, 404 vira `sem_metricas` (removido ou sem métricas) e 500 vira `indisponivel`, como prevê a especificação. Não são exceções: a coleta de um serviço não interrompe a dos outros.
- **Falhas da API:** sem conexão, mais de 10 s sem resposta, outro HTTP de erro ou corpo fora do formato lançam `ExternalApiError` (`EXTERNAL_API_ERROR`, 502, mensagem em pt-BR, causa preservada em `cause`). Falha de rede e timeout ganham mais uma tentativa; respostas HTTP não são repetidas.
- **Testes:** `tests/metrics-api.test.ts` simula a API (sucesso, lista vazia, formato inválido, corpo não JSON, 404, 500, outros HTTP, falha de rede com nova tentativa e timeout) sem acessar a rede.

## Boot, saúde e falhas

O worker descrito na seção final pertence à implementação em revisão da #19; não foi integrado nesta base.

Antes de abrir HTTP, o backend valida ambiente e consulta PostgreSQL. Falha encerra com código não zero e fecha o pool. Cada GET /health executa nova consulta, sem cache de sucesso. Falha em runtime retorna DATABASE_ERROR/500 e mantém HTTP ativo; a chamada seguinte pode recuperar. Timeouts: conexão e statement 3 s; query 4 s. Health verifica conectividade, não valida schema nem ingestão.

JSON inválido retorna 400; rota inexistente 404; erro inesperado 500. Envelope e exemplos em [API](../docs/api.md). SIGINT/SIGTERM fecham HTTP e pool; há limite de 10 s para encerramento do processo.

## Como verificar

Após disponibilizar a #27 (`compose.yaml` com os serviços `backend` e `postgres`), em ambiente descartável e com banco próprio:

1. Subir com `docker compose up --build`: backend só abre a porta após consulta real ao banco.
2. `curl -i http://localhost:3000/health`: 200 e `{"status":"ok","db":"ok"}`.
3. `curl -i -X POST -H 'Content-Type: application/json' --data '{' http://localhost:3000/health`: 400 e VALIDATION_ERROR.
4. `curl -i http://localhost:3000/inexistente`: 404 e NOT_FOUND.
5. Parar somente o banco descartável: health retorna 500/DATABASE_ERROR dentro do timeout; backend permanece ativo. Reiniciar o banco: health volta a 200.
6. Iniciar outro backend com endereço inacessível: código não zero, sem porta HTTP aberta. Ambiente inválido também impede boot.
7. Encerrar backend por SIGTERM: HTTP e pool fechados. Não executar down -v sobre volumes existentes.

`npm test` cobre configuração, espera da verificação, falha/recuperação HTTP, parsing, erros e boot/encerramento com banco falso. É necessário complementar com PostgreSQL real descartável e registrar resultados; testes falsos não comprovam conexão real. Erro inesperado e parsing válido usam aplicações exclusivas dos testes, sem endpoints demonstrativos publicados.

## Repositories — contribuição local da #14

Lucas permanece responsável e futuro revisor; Vinicius atua como apoio autorizado. `ServiceRepository` em `modules/services` lista, busca por ID, faz upsert por `external_id`, atualiza estado e marca ausentes como removidos. Preserva ID/first_seen_at; upsert conserva estados de métricas e reativa reaparecidos. `CollectionRepository` em `modules/collections` somente insere; `UserRepository` no arquivo existente `modules/usuarios/usuarios.repository.ts` busca email sem distinção de caixa. Hash é informação interna, nunca resposta HTTP/log.

Tipos em `shared/persistence.types.ts` mantêm bigint e numeric como strings, datas como Date e ausência como null. Não há parsers globais alterados. Cada coleta usa `nao_calculado`, com campos ambientais nulos; o schema valida métricas e estados. JSON recebido é preservado como objeto; validação da descoberta e mapeamento HTTP pertencem à #19/#16, não aos repositories.

`withTransaction(database, async tx => { ... })`, em `db/transaction.repository.ts`, executa BEGIN/COMMIT/ROLLBACK na mesma conexão. Construa os repositories do callback com `tx`, nunca com o pool. Permite combinar upserts + marcação de ausentes ou inserção de coleta + atualização do serviço atomicamente. `withClient` libera a conexão em finally e descarta conexões quando o callback falha; erros PostgreSQL usam DatabaseError com causa. Falha de rollback preserva ambas as causas. Nenhum erro deve ser registrado como gravação bem-sucedida.

Somente o futuro orquestrador pode chamar `markMissingAsRemoved` após descoberta completa válida; [] válido remove todos logicamente. Falha não é lista vazia. Não há DELETE de serviços/coletas nem UPDATE de coletas. Scheduler, API externa, rotas, JWT e cálculo não são entregues aqui.

Verificação isolada: `cd backend && npm run typecheck && npm test && npm run build`; sem URL de teste, a suíte PostgreSQL é explicitamente pulada. Para executá-la, aplique `database/schema.sql` em banco descartável vazio e prepare a fixture abaixo via psql nesse banco exclusivo:

```sql
SELECT setval(pg_get_serial_sequence('services', 'id'), 9007199254740993, false);
INSERT INTO users (id, email, password_hash) OVERRIDING SYSTEM VALUE
VALUES (9007199254740993, 'review@example.test', '$2b$10$' || repeat('a', 53));
```

A fixture contém um hash sintético apenas no formato exigido pelo CHECK, não credencial de login nem seed da aplicação. No processo de testes, forneça `REPOSITORY_TEST_DATABASE_URL` apontando exclusivamente para esse banco e execute `npm test`. A variável pertence somente ao teste, não à configuração do backend. A suíte altera dados e exige banco novo a cada execução. Use Docker/Ubuntu WSL com rede exclusiva; se localhost do Windows não alcançar o banco, execute os testes em container Node na mesma rede, copiando o backend sem node_modules, dist ou .env para diretório descartável antes de npm ci. Não escreva sobre o checkout montado.

Verificação local em 11/10/2026: tipos/build no Windows aprovados; no Ubuntu WSL, PostgreSQL 16-alpine e Node 24-alpine descartáveis executaram 31/31 testes (6 de integração), tipos e build. A execução que passou compartilhou a rede do container PostgreSQL; tentativas anteriores falharam por banco encerrado/conectividade, sem comprovar integração. npm ci reportou 3 alertas nas dependências existentes, sem alteração de lockfile. Compose integrado, worker e persistência de volume não foram verificados nesta entrega.

## Worker — implementação em revisão da #19

`jobs/collector.ts` executa descoberta completa, reconciliação transacional e coleta por prazo, com HTTP fora das transações. Descoberta inválida preserva cadastro/estados; lista vazia válida marca ausentes como removidos sem fabricar coleta. IDs e primeira descoberta são preservados; retorno permite coleta imediata. Cada observação e atualização de estado usam a mesma transação; falha desfaz ambas e permite continuar os demais serviços.

`POLLING_INTERVAL_MS` (padrão 30000, inteiro entre 1 e 2147483647 ms) controla descoberta e prazo inicial/de recuperação. Métrica válida define próximo prazo pelo intervalo externo; falha conserva o último válido. Dispatcher agenda um tick após o ciclo, sem sobreposição/backfill. Prazos longos ficam como deadlines numéricos, sem timers acima do limite Node; polling da tela é independente. Após reinício, prazos em memória são reconstruídos com coleta inicial, sem compensar histórico.

Antes do INSERT, o worker valida faixa/escala SQL, CPU, GB e intervalo inteiro de 1 a 2147483647 segundos; não arredonda observação inválida. Sucesso: serviço ativo/coleta ok; 404 ainda listado: sem_metricas; falha externa/observação inválida: indisponivel/erro, medidas nulas e diagnóstico. Cálculos permanecem nao_calculado com campos ambientais nulos. SIGTERM impede novos ciclos, cancela HTTP sem diagnóstico artificial, aguarda transação ativa e só então fecha pool, dentro do limite existente de 10s.

Dependência obrigatória: PR #98/#97 fornece JSON original e cancelamento ao cliente HTTP. Este PR #19 nasce diretamente de develop e não inclui commits do precursor; permanece draft até a dependência ser integrada. A #16 mantém resiliência geral; aqui existe somente o tratamento necessário ao worker. Não há confirmação sobre trabalho local não publicado de Lucas. Compose completo/volume continuam na #27; nenhuma infraestrutura concorrente foi criada.

Como verificar isoladamente: `cd backend && npm ci && npm run typecheck && npm test && npm run build`. Para sete testes PostgreSQL (seis existentes e um cenário composto do worker), fornecer REPOSITORY_TEST_DATABASE_URL e WORKER_TEST_DATABASE_URL para **bancos novos distintos e exclusivos**, ambos com schema aplicado; somente o primeiro recebe a fixture sintética já documentada. Sem URLs, integrações são explicitamente puladas. Testes cobrem descoberta, intervalos, retorno, rollback, JSON adicional, bigint, região histórica e shutdown. Teste combinado com #98 deve usar checkout descartável; não duplicar seus commits nesta branch.

Verificações do autor em 13/10/2026, Ubuntu WSL/Docker e PostgreSQL 16 exclusivo: branch independente em Node 24.21.0, typecheck/build e 82/82 testes aprovados (sete PostgreSQL, nenhum pulado). Snapshot descartável combinando #92/#98/#19 em Node 20.20.2: typecheck/build, 125/125 testes e smoke de JSON bruto/HTTP fora da transação/shutdown aprovados. Tentativas de preparação tiveram falhas transitórias de prontidão PostgreSQL, rede npm, esbuild/overlay e leitura do script local; a execução final usou tmpfs exclusivo e terminou com sucesso. Compose completo, volume e revisão independente não foram comprovados.
