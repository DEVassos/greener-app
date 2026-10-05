# Plano de entregas — GreenER (ABP 2DSM 2026-2)

<!-- Arquivo gerenciado pelo time (o agilekit não sobrescreve). Dono: PO (@henriqueptbd-cell); revisão: SM (@travensolli). Alterações via PR; cada mudança de critério/sprint entra no "Histórico de alterações do plano". -->

Este é o plano exigido pela rubrica para as três sprints do projeto **GreenER** (Plataforma para Estimativa do Impacto Ambiental de Aplicações de Software, parceiro UniLaunch). Equipe: Henrique Camargo (PO, `@henriqueptbd-cell`), Gabriel Travensolli (SM, `@travensolli`), Andrea Turibio (dev frontend, `@DeaTuribio`), Lucas Amorim (dev backend, `@LUCASAMR23`), Vinicius Augusto (dev banco de dados, `@viniciusaugusto1997`). Repositório: `DEVassos/greener-app`. Requisitos: [docs/requisitos.md](requisitos.md). Processo: [docs/processo/README.md](processo/README.md).

## Como este plano é lido e pontuado

- **Só o GitHub conta.** A avaliação considera código, documentação, SQL, commits, issues e PRs disponíveis até o fechamento de cada sprint (tag `sprint-N` em `main`).
- **Nota da sprint** = 10 × pontos obtidos ÷ pontos máximos dos critérios previstos para a sprint. Critério parcialmente atendido vale metade; "não avaliável" exige justificativa e decisão do professor.
- **Rubrica cumulativa.** Nas sprints 2 e 3, os critérios aceitos antes precisam continuar funcionando; regressão é apontada na avaliação atual. Por isso o CI e o `teste-avaliador.sh` rodam a cada release.
- **ES01–ES09 e DW01 são avaliados em todas as sprints** (43 pontos) e aparecem na tabela de cada sprint. Os demais critérios (DW02–DW07, BD01–BD04, TP01–TP03, 57 pontos) foram distribuídos pelo time entre as três sprints; a soma dos denominadores cobre os 100 pontos.
- **Situação "Concluído" só após verificação do critério de aceite**, com permalink (SHA) na coluna Evidência. Enquanto isso, a situação é "Planejado", "Em andamento", "Parcial" ou "Movido para Sprint N+1". Nada é declarado pronto antes de estar em `develop`/`main` ([DoD](processo/definition-of-done.md)).
- Nomes nas colunas Responsáveis são os do time; cada integrante aparece em ≥1 linha por sprint (ES09).

## Calendário

| Sprint | Período | Checkpoint (limite para mover critério) | Congelamento | Sprint Review (a confirmar pelo cliente) | Registro pós-review até |
|---|---|---|---|---|---|
| 1 | 29/09 → 19/10/2026 | 09/10 | 18/10 (dom) 20h | 19/10 19h30 | 20/10 23h59 |
| 2 | 20/10 → 09/11/2026 | 30/10 | 08/11 (dom) 20h | 09/11 19h30 | 10/11 23h59 |
| 3 | 10/11 → 23/11/2026 | 17/11 | 22/11 (dom) 20h | 23/11 19h30 | 24/11 23h59 |

Feriados sem aula: 12/10, 15/10, 02/11 e 20/11 (daily assíncrona). Fonte: [`.github/calendario.json`](../.github/calendario.json).

## Resumo da distribuição dos critérios

| Sprint | Critérios além de ES01–ES09 + DW01 | Denominador (pontos máximos) | Requisitos cobertos |
|---|---|---|---|
| 1 | DW02, DW03, DW04, DW07, BD01, BD02, BD03, TP02 | **79** | RF01, RF03, RF04, RF10, RF12, RF09 (parcial: estado e localização); could RF02, RF05, RF06 |
| 2 | DW05, DW06, TP01, TP03 | **61** | RF02, RF05, RF06, RF07, RF08, RF09 (completo), RF11, RNF02, RNF04, RP06 |
| 3 | BD04 | **46** | RF14, RF15, RF13 (could), RNF01, RNF03; revisão final de regressões e portfólio |

## Sprint 1

**Período:** 29/09 → 19/10/2026 (checkpoint 09/10, congelamento 18/10 20h, review 19/10 19h30 — a confirmar). **Milestone:** `Sprint 1`. **Registro:** `docs/sprints/sprint-1.md`.

**Objetivo:** pipeline de coleta persistido em Docker **e primeira tela apresentável do dashboard**: o backend descobre os serviços no agregador, coleta métricas e grava o histórico no PostgreSQL; o frontend lista os serviços descobertos com estado de monitoramento e localização, atualizando sem recarregar a página. A aplicação inteira sobe com `docker compose up --build`.

**Critérios previstos:** ES01–ES09, DW01 (43) + DW02 (5), DW03 (6), DW04 (4), DW07 (3), BD01 (4), BD02 (6), BD03 (2), TP02 (6) = **denominador 79**.

| Código | Requisito relacionado | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| ES01 | RP07, RP05 | Product Backlog com as 15 RF e 5 RNF como issues `tipo:historia` priorizadas (`prioridade:must/should/could`) e retrato versionado em `docs/backlog/product-backlog.md` | Abrir Issues com filtro `label:tipo:historia`; conferir no backlog exportado que RF01–RF15 têm issue | Henrique (PO) | a registrar no fechamento | Planejado |
| ES02 | RP07 | Milestone `Sprint 1` com itens, responsáveis e estimativas; `docs/sprints/sprint-1/planning.md` e `docs/sprints/sprint-1.md` publicados por PR na primeira semana | Conferir a milestone e a data do PR de planejamento (anterior ao fim da sprint) | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES03 | RP07 | Cada história da milestone com ≥2 critérios de aceite Dado/Quando/Então e seção "Como verificar (avaliador)" | Abrir as issues da milestone; executar o "Como verificar" de uma delas em ≤5 min | Henrique (PO) | a registrar no fechamento | Planejado |
| ES04 | RP07 | Cadeia requisito → issue (label `RFxx`) → branch `tipo/<n>-slug` → commit `(#n)` → PR `Closes #n` → permalink nesta tabela | `git log develop --oneline` mostra `#n` em cada commit; PRs mergeados têm `Closes`; coluna Evidência com permalinks | Henrique (PO) | a registrar no fechamento | Planejado |
| ES05 | RP07 | Commits e PRs distribuídos ao longo da sprint, com mensagens Conventional Commits em pt-BR; ≥1 PR mergeado por semana por dev | `gh pr list --state merged`; histograma de commits por dia em `contribuicao.md` | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES06 | RP07 | `docs/sprints/sprint-1/review.md` (demonstrado, feedback do cliente, decisões) e seção Review em `sprint-1.md`; issues `feedback-cliente` na milestone `Sprint 2`; entrada no histórico deste plano | Ler `review.md`; `gh issue list --label feedback-cliente` | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES07 | RP07 | DoD documentada em `docs/processo/definition-of-done.md`; checklist DoD-PR marcada em cada PR mergeado; review "DoD verificada"; tabela "Verificações realizadas" em `sprint-1.md` | Abrir PRs mergeados: checklist completa e aprovação de alguém ≠ autor; conferir a tabela | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES08 | RNF05, RP05 | `README.md` com problema/solução, funcionalidades implementadas `(RFxx, #PR)`, tecnologias, integrantes e execução; `database/README.md`, `backend/README.md`, `frontend/README.md` e `docs/api.md` compatíveis com a versão entregue | Em um clone limpo, seguir o README até a aplicação subir e o endpoint responder | Henrique (PO), Gabriel (SM) | a registrar no fechamento | Planejado |
| ES09 | — | Cada integrante com contribuição verificável na sprint (código, SQL, interface, documentação, planejamento ou revisão) consolidada em `docs/sprints/sprint-1/contribuicao.md` | Tabela de contribuição sem lacunas; commits, PRs, reviews e issues por login no GitHub | Henrique, Gabriel, Andrea, Lucas, Vinicius | a registrar no fechamento | Planejado |
| DW01 | RP01, RP02 | `frontend/` (Vite + React + TypeScript), `backend/` (Node.js + TypeScript), `database/` e `docs/` separados, com `package.json` e `tsconfig.json` efetivamente usados | Abrir `package.json` e `tsconfig.json` de cada módulo; `npm run build` nos dois | Andrea (frontend), Lucas (backend) | a registrar no fechamento | Planejado |
| DW02 | RF01, RF03, RF04, RNF04 | `backend/src/integrations/metrics-api.ts` (`GET /services`, `GET /metrics/{id}`) e `carbon-api.ts` com timeout, validação da resposta e falha tratada sem derrubar o processo; coletor periódico grava as coletas | `curl http://localhost:3000/services` retorna os serviços do agregador; apontar a URL da API para um endereço inválido no `.env` e conferir que o backend segue respondendo com erro tratado e log | Lucas (backend) | a registrar no fechamento | Planejado |
| DW03 | RF01, RF03, RF10, RP02 | Módulos `services` e `collections` com `routes/controller/service/repository`; `GET /services`, `GET /services/:id`, `GET /collections?serviceId=`; erro padrão `{ "error": { "code", "message" } }`; `docs/api.md` | `curl` em cada endpoint; `404` para id inexistente; `400` para query inválida; comparar respostas com `docs/api.md` | Lucas (backend) | a registrar no fechamento | Planejado |
| DW04 | RF09 (parcial), RF12, RP01 | Tela de serviços com `pages/ServicesPage`, `components/ServiceCard`, `services/api.ts`, `hooks/usePolling`, `contexts/MonitoringContext`, `providers/MonitoringProvider` em uso real; lista com estado e localização atualizando sozinha | Abrir `http://localhost:5173`; ver a lista com estado e localização; parar o agregador e ver o estado mudar sem recarregar; conferir que cada pasta tem arquivo importado | Andrea (frontend) | a registrar no fechamento | Planejado |
| DW07 | RP04, RNF05 | `compose.yaml` com `frontend`, `backend` e `postgres` (volume nomeado, healthcheck), `frontend/Dockerfile`, `backend/Dockerfile`, `.env.example`, instruções no README | Em um clone limpo: `cp .env.example .env && docker compose up --build`; três containers saudáveis; frontend e backend respondem | Vinicius (db), Lucas (backend) | a registrar no fechamento | Planejado |
| BD01 | RP03, RF10, RF04 | `database/schema.sql` com `services`, `collections` e `metrics` (PK, FK, `NOT NULL`, `UNIQUE`, `CHECK`, índice por serviço e data); modelo descrito em `database/README.md` | `psql -f database/schema.sql` em um PostgreSQL vazio; `\dt` e `\d collections` mostram tabelas, chaves e restrições | Vinicius (db) | a registrar no fechamento | Planejado |
| BD02 | RP03, RF03, RF10 | `INSERT`/`SELECT`/`UPDATE` com placeholders `$1…$n` em `services.repository.ts` e `collections.repository.ts`; nenhum ORM; nenhuma interpolação | `grep -n '\$1' backend/src/modules/*/*.repository.ts`; `bash .github/scripts/check-forbidden.sh`; executar a coleta e consultar o histórico de um serviço | Vinicius (db), Lucas (backend) | a registrar no fechamento | Planejado |
| BD03 | RF10, RP04 | `backend/src/db/connection.ts` com pool do `pg` lendo variáveis de ambiente; volume `pgdata` no compose; registros preservados após reinício | Deixar coletar, `docker compose down && docker compose up`, `SELECT count(*) FROM collections` igual ou maior que antes | Vinicius (db) | a registrar no fechamento | Planejado |
| TP02 | RP01, RP02 | `strict: true` nos dois `tsconfig.json`; interfaces/tipos para serviço, métrica, coleta e respostas das APIs auxiliares; zero `any` sem `// any-justificado:` | `npx tsc --noEmit` nos dois módulos; `grep -rn ': any' frontend/src backend/src` vazio ou justificado | Lucas (backend), Andrea (frontend) | a registrar no fechamento | Planejado |

**Gatilhos de replanejamento da Sprint 1** (decididos pelo PO com o time, registrados no histórico):

- Se `GET /services` e `GET /collections` não estiverem mergeados em `develop` até **11/10**, DW02 passa para a Sprint 2 (denominador da Sprint 1 cai para 74).
- Se a tela de serviços não estiver mergeada em `develop` até **14/10**, DW04 passa para a Sprint 2 (denominador cai para 75).

Entregas de apoio sem critério próprio na Sprint 1: ADRs 0001–0003 em `docs/adr/`, processo em `docs/processo/`, templates em `docs/templates/`, `docs/requisitos.md`.

## Sprint 2

**Período:** 20/10 → 09/11/2026 (checkpoint 30/10, congelamento 08/11 20h, review 09/11 19h30 — a confirmar). **Milestone:** `Sprint 2`. **Registro:** `docs/sprints/sprint-2.md`.

**Objetivo:** dashboard completo com energia e CO₂e por serviço e indicadores agregados, tolerância a falhas (serviço indisponível, sem métricas, API fora do ar) visível na interface, atualização periódica com intervalo e "Última atualização" informados, e área de configuração do monitoramento protegida por JWT no backend. Tudo o que foi aceito na Sprint 1 continua funcionando.

**Critérios previstos:** ES01–ES09, DW01 (43) + DW05 (3), DW06 (3), TP01 (6), TP03 (6) = **denominador 61**.

| Código | Requisito relacionado | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| ES01 | RP07, RP05 | Backlog repriorizado após a review da Sprint 1, com as issues `feedback-cliente`; `docs/backlog/product-backlog.md` regenerado | Issues com `feedback-cliente` na milestone `Sprint 2`; cobertura RF01–RF15 no export | Henrique (PO) | a registrar no fechamento | Planejado |
| ES02 | RP07 | Milestone `Sprint 2` com itens, responsáveis e estimativas; `docs/sprints/sprint-2/planning.md` e `docs/sprints/sprint-2.md` publicados em 20/10 | Conferir a milestone e a data do PR de planejamento | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES03 | RP07 | Histórias da milestone com critérios Dado/Quando/Então e "Como verificar", incluindo cenários de falha (API fora, serviço sem métricas) | Executar o "Como verificar" de uma história de tolerância a falhas | Henrique (PO) | a registrar no fechamento | Planejado |
| ES04 | RP07 | Cadeia requisito → issue → branch → commit `(#n)` → PR → permalink mantida; ADRs com rastreabilidade (issue/RF/critério) | `git log develop` com `#n`; `docs/adr/` referenciando issues e critérios | Henrique (PO) | a registrar no fechamento | Planejado |
| ES05 | RP07 | Entregas progressivas: PRs mergeados em ≥2 semanas distintas por dev; nenhuma entrega "tudo no último dia" | `gh pr list --state merged --search "merged:2026-10-20..2026-11-09"`; histograma em `contribuicao.md` | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES06 | RP07 | `docs/sprints/sprint-2/review.md` e seção Review em `sprint-2.md`; feedback da Sprint 1 rastreado até as issues entregues; alterações para a Sprint 3 no histórico deste plano | Ler `review.md`; conferir que as issues `feedback-cliente` da Sprint 1 foram fechadas por PR | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES07 | RP07 | DoD aplicada: checklist em cada PR, reviews "DoD verificada", tabela "Verificações realizadas" em `sprint-2.md` incluindo reteste dos critérios da Sprint 1 (regressão) | Abrir PRs mergeados; conferir a tabela e o reteste | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES08 | RNF05, RP05 | README atualizado com as funcionalidades da Sprint 2; `docs/arquitetura.md` (partes, fluxo de dados, modelo de dados, intervalos) e `docs/calculos.md` (fórmulas, fatores, exemplo) criados junto com o código | Seguir o README em clone limpo; conferir que `arquitetura.md` descreve o que está no código e `calculos.md` bate com os valores exibidos | Henrique (PO), Gabriel (SM) | a registrar no fechamento | Planejado |
| ES09 | — | Cada integrante com contribuição verificável em `docs/sprints/sprint-2/contribuicao.md`; PO com `calculos.md` e seed de fatores; SM com CI e atas | Tabela de contribuição sem lacunas | Henrique, Gabriel, Andrea, Lucas, Vinicius | a registrar no fechamento | Planejado |
| DW01 | RP01, RP02 | Módulos frontend e backend em TypeScript estrito mantidos; dependências novas (JWT, hash de senha) declaradas e usadas | `npm run build` nos dois módulos; `package.json` sem dependência não utilizada | Andrea (frontend), Lucas (backend) | a registrar no fechamento | Planejado |
| DW05 | RF08, RF09, RF11, RNF02, RF05, RF06 | Dashboard com cards por serviço (estado, localização, métricas, energia, CO₂e), painel de indicadores agregados, intervalo de atualização configurável e "Última atualização: hh:mm:ss"; estados "indisponível" e "sem métricas" destacados | Abrir o dashboard; aguardar o intervalo e ver a hora mudar sem recarregar; derrubar um serviço e ver o estado; comparar valores com `GET /collections` | Andrea (frontend) | a registrar no fechamento | Planejado |
| DW06 | RP06 | Módulo `auth` com `POST /auth/login` (JWT), middleware de autenticação, rotas `/monitoring-settings` protegidas, senha com hash (`bcrypt`), segredo via variável de ambiente; tabela `users` em `schema.sql` | `PUT /monitoring-settings` sem token → `401`; com token → `200`; segredo ausente do repositório; senha não aparece em texto puro no banco | Lucas (backend), Vinicius (db) | a registrar no fechamento | Planejado |
| TP01 | RF07, RF02 | Classes de domínio em `backend/src/domain/` (`Service`, `Collection`, `EnergyEstimate`, `CarbonCalculator`, `MonitoringStatus`) com encapsulamento, usadas pelos services e pelo coletor | Ler as classes e os pontos de uso nos services; testes unitários do cálculo passam | Lucas (backend) | a registrar no fechamento | Planejado |
| TP03 | RNF04, RF02, RF05, RF06 | `backend/src/shared/errors.ts` (erros tipados), `middlewares/error-handler.ts`, `try/catch` com mensagens compreensíveis nas integrações e repositories; falhas de API/banco viram estado visível, nunca resultado válido | Simular API fora do ar e banco parado: backend responde erro padronizado, frontend mostra aviso, processo segue vivo; `grep` de `catch` vazio retorna nada | Lucas (backend), Andrea (frontend) | a registrar no fechamento | Planejado |

Entregas de apoio sem critério próprio na Sprint 2: `docs/arquitetura.md`, `docs/calculos.md` (PO com o dev backend), ADR sobre polling vs SSE, ADR sobre o modelo de potência e fatores de emissão, ADR sobre a autenticação JWT.

## Sprint 3

**Período:** 10/11 → 23/11/2026 — 14 dias, feriado 20/11 (checkpoint 17/11, congelamento 22/11 20h, review 23/11 19h30 — a confirmar). **Milestone:** `Sprint 3`. **Registro:** `docs/sprints/sprint-3.md`.

**Objetivo:** ranking de impacto e comparação entre serviços por período, mapa dos serviços com coordenadas (could), revisão de usabilidade/responsividade e desempenho, e repositório pronto para ser apresentado como portfólio: sem regressões, documentação conferida comando a comando. Tudo o que foi aceito nas Sprints 1 e 2 continua funcionando.

**Critérios previstos:** ES01–ES09, DW01 (43) + BD04 (3) = **denominador 46**.

| Código | Requisito relacionado | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| ES01 | RP07, RP05 | Backlog final: todas as RF obrigatórias concluídas ou com decisão registrada; `docs/backlog/product-backlog.md` final | Cobertura RF01–RF15 no export sem "sem issue"; issues abertas restantes justificadas | Henrique (PO) | a registrar no fechamento | Planejado |
| ES02 | RP07 | Milestone `Sprint 3`, `docs/sprints/sprint-3/planning.md` e `sprint-3.md` publicados em 10/11 (planning na noite de 09/11) | Conferir a milestone e a data do PR de planejamento | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES03 | RP07 | Histórias de ranking, comparação e mapa com critérios Dado/Quando/Então que citam o período e os serviços selecionados | Executar o "Como verificar" da história de ranking | Henrique (PO) | a registrar no fechamento | Planejado |
| ES04 | RP07 | Cadeia completa mantida nas três sprints; este plano com permalinks em todas as linhas concluídas | Amostrar 3 linhas do plano e seguir issue → PR → arquivo | Henrique (PO) | a registrar no fechamento | Planejado |
| ES05 | RP07 | PRs mergeados nas duas semanas da sprint, por dev; nenhum "PR gigante" no fim | `gh pr list --state merged --search "merged:2026-11-10..2026-11-23"` | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES06 | RP07 | `docs/sprints/sprint-3/review.md`, seção Review em `sprint-3.md`, feedback das sprints anteriores rastreado; histórico deste plano fechado | Ler `review.md` e o histórico; issues `feedback-cliente` da Sprint 2 fechadas por PR | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES07 | RP07 | DoD aplicada em cada PR; "Verificações realizadas" em `sprint-3.md` com reteste de todos os critérios das Sprints 1 e 2 (regressão) | Abrir PRs mergeados; conferir a tabela de reteste com data e responsável | Gabriel (SM) | a registrar no fechamento | Planejado |
| ES08 | RNF05, RP05 | README, `docs/arquitetura.md`, `docs/api.md`, `docs/calculos.md` e READMEs de módulo conferidos comando a comando em clone limpo; links válidos | Seguir o README do zero; verificar cada link; comparar `api.md` com `curl` | Henrique (PO), Gabriel (SM) | a registrar no fechamento | Planejado |
| ES09 | — | `docs/sprints/sprint-3/contribuicao.md` sem lacunas; cada integrante demonstrou ≥1 item nas três reviews | Tabela de contribuição; atas de review | Henrique, Gabriel, Andrea, Lucas, Vinicius | a registrar no fechamento | Planejado |
| DW01 | RP01, RP02 | Módulos frontend e backend em TypeScript estrito mantidos e separados de `docs/` e `database/` | `npm run build` nos dois módulos; estrutura do repositório | Andrea (frontend), Lucas (backend) | a registrar no fechamento | Planejado |
| BD04 | RF14, RF15, RF08, RF04, RNF03 | Consultas em `collections.repository.ts` e `analytics.repository.ts` com `SUM`, `AVG`, `GROUP BY service_id`, `ORDER BY` por energia ou CO₂e, filtros `collected_at BETWEEN $1 AND $2` e `service_id = ANY($3)`; endpoints `GET /ranking?metric=&period=` e `GET /comparison?serviceIds=&period=`; índices que sustentam o período | Executar as consultas com dados conhecidos e conferir totais contra `SELECT` manual; mudar o período e ver o resultado mudar; `EXPLAIN` usa o índice | Vinicius (db), Lucas (backend) | a registrar no fechamento | Planejado |

Entregas de apoio sem critério próprio na Sprint 3: telas de ranking e comparação (Andrea, RF14/RF15 — cobertas por DW03/DW04/DW05 cumulativos), mapa com coordenadas quando a API fornecer (Andrea, RF13 could), revisão de responsividade (RNF01) e desempenho (RNF03), limpeza final do repositório para portfólio.

## Rastreabilidade dos requisitos não funcionais e do projeto

Os RNF e RP não têm linha própria de pontuação; são comprovados pelos critérios abaixo e aparecem na coluna "Requisito relacionado" das tabelas.

| Requisito | Comprovado por | Sprint | Responsáveis |
|---|---|---|---|
| RNF01 — Usabilidade e responsividade | DW04 (revisão final de layout) | 3 | Andrea |
| RNF02 — Atualização em tempo real | DW05 (intervalo e "Última atualização") | 2 | Andrea |
| RNF03 — Desempenho | DW05, BD04 (consultas por período com índice) | 3 | Vinicius, Andrea |
| RNF04 — Tolerância a falhas | DW02 (falha de API tratada), TP03 (exceções) | 1 (backend não cai), 2 (visível na interface) | Lucas, Andrea |
| RNF05 — Documentação técnica | ES08, DW07 | todas | Henrique, Gabriel, devs (docs do próprio PR) |
| RP01 — React + TypeScript | DW01, DW04 | todas | Andrea |
| RP02 — Node.js + TypeScript | DW01, DW03 | todas | Lucas |
| RP03 — PostgreSQL sem ORM | BD01, BD02 ([ADR 0002](adr/0002-postgresql-pg-sem-orm.md)) | 1 | Vinicius |
| RP04 — Execução containerizada | DW07, BD03 ([ADR 0003](adr/0003-docker-compose-unico-caminho.md)) | 1 | Vinicius, Lucas |
| RP05 — MVP | ES01, ES08 | todas | Henrique |
| RP06 — Autenticação JWT no backend | DW06 | 2 | Lucas, Vinicius |
| RP07 — Gestão ágil | ES01–ES06 ([ADR 0001](adr/0001-gitflow-commits-coautoria.md)) | todas | Henrique, Gabriel |

## Participação dos integrantes

A participação é registrada por sprint em `docs/sprints/sprint-N/contribuicao.md` (gerado por `.github/scripts/evidencias.sh N`, revisado pelo SM): issues atribuídas, PRs mergeados, reviews, commits em `develop`, áreas tocadas e lacunas por integrante. Os mínimos por papel estão em [docs/processo/README.md § 1.1](processo/README.md). Cada integrante consta como responsável em ≥1 linha de cada sprint acima.

| Integrante | Papel | Responsabilidades fixas | Relatórios |
|---|---|---|---|
| Henrique Camargo `@henriqueptbd-cell` | PO | histórias e critérios de aceite, este plano, aceite executando o "Como verificar", `docs/calculos.md`, feedback do cliente | `docs/sprints/sprint-1/contribuicao.md` · `sprint-2/` · `sprint-3/` |
| Gabriel Travensolli `@travensolli` | SM | planning, atas de daily, review/retro, DoR/DoD, quadro, `.github/` (workflows e scripts), release e tag | idem |
| Andrea Turibio `@DeaTuribio` | dev frontend | `frontend/`, tela de serviços, dashboard, ranking/comparação/mapa, `frontend/README.md` | idem |
| Lucas Amorim `@LUCASAMR23` | dev backend | `backend/`, integrações com as APIs auxiliares, API REST, JWT, classes de domínio, `docs/api.md`, `backend/README.md` | idem |
| Vinicius Augusto `@viniciusaugusto1997` | dev banco de dados | `database/schema.sql`, repositories, persistência, consultas analíticas, `database/README.md` | idem |

## Histórico de alterações do plano

| Data | Alteração | Motivo | Quem |
|---|---|---|---|
| 05/10/2026 | Plano inicial publicado: distribuição dos critérios nas três sprints (denominadores 79 / 61 / 46), DW04 na Sprint 1 e DW06 na Sprint 2, gatilhos de 11/10 (DW02) e 14/10 (DW04) | Primeira versão, a validar com o time e o professor na aula seguinte | Henrique (PO), Gabriel (SM) |
