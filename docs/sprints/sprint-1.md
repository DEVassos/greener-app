# Sprint 1 — pipeline de coleta em Docker e primeira tela do dashboard

| Campo | Valor |
|---|---|
| Período | 29/09 a 19/10/2026 · checkpoint 09/10 · congelamento 18/10 20h · review 19/10 19h30 (data da review a confirmar com o cliente) |
| Milestone | [Sprint 1](https://github.com/DEVassos/greener-app/milestone/1) |
| Critérios previstos | ES01–ES09, DW01 + DW02, DW03, DW04, DW07, BD01, BD02, BD03, TP02 — denominador **79** |
| Plano | [docs/plano-de-entregas.md § Sprint 1](../plano-de-entregas.md#sprint-1) |
| Planejamento | [sprint-1/planning.md](sprint-1/planning.md) |
| Daily | issue fixada [#74 Daily — Sprint 1](https://github.com/DEVassos/greener-app/issues/74); atas em PR semanal pelas issues [#72](https://github.com/DEVassos/greener-app/issues/72) e [#73](https://github.com/DEVassos/greener-app/issues/73) |

## 1. Objetivo da sprint

Pipeline de coleta persistido em Docker e primeira tela apresentável do dashboard: o backend descobre os serviços no agregador, coleta métricas e grava o histórico no PostgreSQL; o frontend lista os serviços descobertos com estado de monitoramento e localização, atualizando sem recarregar a página. A aplicação inteira sobe com `docker compose up --build`.

O [planning.md](sprint-1/planning.md) guarda a proposta inicial do PO (100 pontos, 25 tarefas, 82 story points). Em 05/10 a sprint foi replanejada para **79 pontos e 19 tarefas**, com motor de cálculo, KPIs e JWT na Sprint 2 e exportação na Sprint 3 ([histórico do plano](../plano-de-entregas.md#histórico-de-alterações-do-plano)). Este registro segue o plano vigente.

## 2. Critérios previstos e responsáveis

| Critério | Pontos | Responsáveis no plano | Issues que entregam |
|---|---|---|---|
| ES01–ES09 | 40 | Henrique (PO), Gabriel (SM), todos em ES09 | [#3](https://github.com/DEVassos/greener-app/issues/3), [#4](https://github.com/DEVassos/greener-app/issues/4), [#47](https://github.com/DEVassos/greener-app/issues/47), [#64](https://github.com/DEVassos/greener-app/issues/64), [#65](https://github.com/DEVassos/greener-app/issues/65), [#72](https://github.com/DEVassos/greener-app/issues/72), [#73](https://github.com/DEVassos/greener-app/issues/73), [#78](https://github.com/DEVassos/greener-app/issues/78) |
| DW01 | 3 | Andrea, Lucas | [#8](https://github.com/DEVassos/greener-app/issues/8), [#9](https://github.com/DEVassos/greener-app/issues/9) |
| DW02 | 5 | Lucas | [#15](https://github.com/DEVassos/greener-app/issues/15), [#16](https://github.com/DEVassos/greener-app/issues/16), [#17](https://github.com/DEVassos/greener-app/issues/17) |
| DW03 | 6 | Lucas | [#8](https://github.com/DEVassos/greener-app/issues/8), [#15](https://github.com/DEVassos/greener-app/issues/15), [#19](https://github.com/DEVassos/greener-app/issues/19) |
| DW04 | 4 | Andrea | [#9](https://github.com/DEVassos/greener-app/issues/9), [#22](https://github.com/DEVassos/greener-app/issues/22), [#23](https://github.com/DEVassos/greener-app/issues/23) |
| DW07 | 3 | Vinicius, Lucas | [#7](https://github.com/DEVassos/greener-app/issues/7), [#26](https://github.com/DEVassos/greener-app/issues/26), [#27](https://github.com/DEVassos/greener-app/issues/27) |
| BD01 | 4 | Vinicius | [#5](https://github.com/DEVassos/greener-app/issues/5), [#28](https://github.com/DEVassos/greener-app/issues/28) |
| BD02 | 6 | Vinicius, Lucas | [#14](https://github.com/DEVassos/greener-app/issues/14) |
| BD03 | 2 | Vinicius | [#27](https://github.com/DEVassos/greener-app/issues/27) |
| TP02 | 6 | Lucas, Andrea | [#8](https://github.com/DEVassos/greener-app/issues/8), [#9](https://github.com/DEVassos/greener-app/issues/9) |

Gatilhos de replanejamento (plano § Sprint 1): `GET /services` e `GET /collections` em `develop` até 11/10, senão DW02 vai para a Sprint 2 (denominador 74); tela de serviços em `develop` até 14/10, senão DW04 vai para a Sprint 2 (denominador 75).

## 3. Itens da milestone e situação em 15/10/2026

### 3.1 Histórias

| Issue | Título | Requisitos | Responsável | Situação em 15/10/2026 |
|---|---|---|---|---|
| [#42](https://github.com/DEVassos/greener-app/issues/42) | US01 — Descoberta e ingestão dinâmica de serviços | RF01–RF06, RNF04 | @LUCASAMR23 | aberta; cliente de métricas ([#95](https://github.com/DEVassos/greener-app/pull/95)), JSON bruto ([#98](https://github.com/DEVassos/greener-app/pull/98)) e rota de serviços ([#115](https://github.com/DEVassos/greener-app/pull/115)) mergeados; falta [#16](https://github.com/DEVassos/greener-app/issues/16) |
| [#44](https://github.com/DEVassos/greener-app/issues/44) | US03 — Modelagem e persistência em PostgreSQL (SQL puro) | RF10 | @viniciusaugusto1997 | aberta; schema ([#77](https://github.com/DEVassos/greener-app/pull/77)), UML ([#57](https://github.com/DEVassos/greener-app/pull/57)), repositories ([#94](https://github.com/DEVassos/greener-app/pull/94)) e histórico de coletas ([#116](https://github.com/DEVassos/greener-app/pull/116)) mergeados |
| [#46](https://github.com/DEVassos/greener-app/issues/46) | US05 — Infraestrutura e dockerização total | RNF05 | @travensolli | aberta; Dockerfiles ([#91](https://github.com/DEVassos/greener-app/pull/91)), compose com Postgres e backend ([#113](https://github.com/DEVassos/greener-app/pull/113)) e frontend com nginx ([#81](https://github.com/DEVassos/greener-app/pull/81)) mergeados |
| [#47](https://github.com/DEVassos/greener-app/issues/47) | US06 — Gestão e documentação da sprint | RNF05 | @henriqueptbd-cell | aberta; fechada por este PR, que revisa planejamento, plano de entregas, este registro e o README |

A história [#45](https://github.com/DEVassos/greener-app/issues/45) (US04 — dashboard executivo e operacional) saiu da Sprint 1 no replanejamento: está na milestone `Sprint 2` (§3.4).

### 3.2 Tarefas técnicas

| Issue | Título | Requisito | Critério | Responsável | Situação em 15/10/2026 | PR |
|---|---|---|---|---|---|---|
| [#5](https://github.com/DEVassos/greener-app/issues/5) | Script DDL `schema.sql` para PostgreSQL | RF10 | BD01 | @LUCASAMR23 | mergeado em `develop` | [#77](https://github.com/DEVassos/greener-app/pull/77) |
| [#9](https://github.com/DEVassos/greener-app/issues/9) | Setup do projeto React com TypeScript, Vite e Tailwind | RNF01 | DW01, DW04 | @travensolli | mergeado em `develop` | [#62](https://github.com/DEVassos/greener-app/pull/62) |
| [#11](https://github.com/DEVassos/greener-app/issues/11) | Guia de estilos e design system dark mode | RNF01 | ES07 | @travensolli, @DeaTuribio | mergeado em `develop` | [#61](https://github.com/DEVassos/greener-app/pull/61) |
| [#22](https://github.com/DEVassos/greener-app/issues/22) | Tabela operacional de serviços com status e localização | RF09, RF12 | DW04 | @DeaTuribio | mergeado em `develop` | [#69](https://github.com/DEVassos/greener-app/pull/69) |
| [#28](https://github.com/DEVassos/greener-app/issues/28) | Modelagem UML (diagrama de classes / ERD) com Mermaid | — | BD01, DW01 | @LUCASAMR23, @viniciusaugusto1997 | mergeado em `develop` | [#57](https://github.com/DEVassos/greener-app/pull/57) |
| [#67](https://github.com/DEVassos/greener-app/issues/67) | ADR 0004: Vite e Tailwind CSS no frontend | RNF05 | ES08 | @travensolli | mergeado em `develop` | [#76](https://github.com/DEVassos/greener-app/pull/76) |
| [#8](https://github.com/DEVassos/greener-app/issues/8) | Setup da API REST Node.js com TypeScript e estrutura modular | — | DW01, DW03 | @LUCASAMR23 | mergeado em `develop` | [#86](https://github.com/DEVassos/greener-app/pull/86) |
| [#12](https://github.com/DEVassos/greener-app/issues/12) | Componente de indicador visual de última atualização | RNF02 | ES03 | @travensolli | mergeado em `develop` | [#89](https://github.com/DEVassos/greener-app/pull/89) |
| [#23](https://github.com/DEVassos/greener-app/issues/23) | Hook de polling e atualização sem recarregar | RF11, RNF02 | DW04 | @DeaTuribio | mergeado em `develop` | [#100](https://github.com/DEVassos/greener-app/pull/100) |
| [#7](https://github.com/DEVassos/greener-app/issues/7) | Variáveis de ambiente e `.env.example` | — | DW07 | @henriqueptbd-cell | mergeado em `develop` | [#82](https://github.com/DEVassos/greener-app/pull/82) |
| [#10](https://github.com/DEVassos/greener-app/issues/10) | Protótipo de alta fidelidade no Figma | RNF01 | ES03 | @travensolli | mergeado em `develop` | [#101](https://github.com/DEVassos/greener-app/pull/101) |
| [#14](https://github.com/DEVassos/greener-app/issues/14) | Repositories em SQL puro parametrizado | RF10 | BD02 | @LUCASAMR23 | mergeado em `develop` | [#94](https://github.com/DEVassos/greener-app/pull/94) |
| [#15](https://github.com/DEVassos/greener-app/issues/15) | Cliente HTTP da API agregadora de métricas | RF01, RF03 | DW02, DW03 | @DeaTuribio, @LUCASAMR23 | mergeado em `develop` | [#95](https://github.com/DEVassos/greener-app/pull/95) |
| [#16](https://github.com/DEVassos/greener-app/issues/16) | Tratamento de erros e mapeamento de status HTTP | RF05, RF06, RNF04 | DW02 | @LUCASAMR23 | **aberta** — única tarefa da Sprint 1 ainda sem PR | — |
| [#17](https://github.com/DEVassos/greener-app/issues/17) | Cliente HTTP da API de intensidade de carbono | RF07 | DW02 | @viniciusaugusto1997 | mergeado em `develop` | [#92](https://github.com/DEVassos/greener-app/pull/92) |
| [#19](https://github.com/DEVassos/greener-app/issues/19) | Worker de polling e reconciliação em background | RF02, RF04 | DW03 | @viniciusaugusto1997 | mergeado em `develop` | [#99](https://github.com/DEVassos/greener-app/pull/99) |
| [#26](https://github.com/DEVassos/greener-app/issues/26) | Dockerfiles do backend e do frontend | — | DW07 | @travensolli | mergeado em `develop` | [#91](https://github.com/DEVassos/greener-app/pull/91) |
| [#27](https://github.com/DEVassos/greener-app/issues/27) | `compose.yaml` com volume persistente do PostgreSQL | RNF05 | DW07, BD03 | @henriqueptbd-cell | mergeado em `develop` | [#113](https://github.com/DEVassos/greener-app/pull/113) |
| [#64](https://github.com/DEVassos/greener-app/issues/64) | Conferir o Project Kanban e documentar seus campos | RNF05 | ES04, ES09 | @travensolli | mergeado em `develop` | [#83](https://github.com/DEVassos/greener-app/pull/83) |
| [#65](https://github.com/DEVassos/greener-app/issues/65) | Atribuir responsáveis às histórias da Sprint 1 | RNF05 | ES09 | @henriqueptbd-cell | mergeado em `develop` | [#85](https://github.com/DEVassos/greener-app/pull/85) |
| [#66](https://github.com/DEVassos/greener-app/issues/66) | Corrigir cor primária, tokens e nome EcoPulse no guia visual | RNF01 | — | @travensolli | mergeado em `develop` | [#84](https://github.com/DEVassos/greener-app/pull/84) |

#### Tarefas abertas durante a sprint (criadas depois do planejamento)

| Issue | Título | Requisito | Critério | Responsável | Situação em 15/10/2026 | PR |
|---|---|---|---|---|---|---|
| [#80](https://github.com/DEVassos/greener-app/issues/80) | Containerizar o frontend com nginx no compose | RNF05 | DW07 | @travensolli | mergeado em `develop` | [#81](https://github.com/DEVassos/greener-app/pull/81) |
| [#87](https://github.com/DEVassos/greener-app/issues/87) | Aplicar a paleta em tons de verde-escuro | RNF01 | — | @DeaTuribio | mergeado em `develop` | [#88](https://github.com/DEVassos/greener-app/pull/88) |
| [#97](https://github.com/DEVassos/greener-app/issues/97) | Expor JSON bruto e cancelamento no cliente de métricas | RF03 | DW02 | @viniciusaugusto1997 | mergeado em `develop` | [#98](https://github.com/DEVassos/greener-app/pull/98) |
| [#104](https://github.com/DEVassos/greener-app/issues/104) | Restaurar as variáveis do `.env.example` | RNF02 | DW07 | @DeaTuribio | mergeado em `develop` | [#105](https://github.com/DEVassos/greener-app/pull/105) |
| [#106](https://github.com/DEVassos/greener-app/issues/106) | Ajustar o polling após a revisão do #100 | RF11 | DW04 | @DeaTuribio | mergeado em `develop` | [#114](https://github.com/DEVassos/greener-app/pull/114) |
| [#109](https://github.com/DEVassos/greener-app/issues/109) | Atualizar `checkout` e `setup-node` para v7 | RNF05 | DW01 | @travensolli | mergeado em `develop` | [#110](https://github.com/DEVassos/greener-app/pull/110) |
| [#111](https://github.com/DEVassos/greener-app/issues/111) | Expor os serviços monitorados na API | RF01, RF09 | DW03, DW04 | @LUCASAMR23 | mergeado em `develop` | [#115](https://github.com/DEVassos/greener-app/pull/115) |
| [#112](https://github.com/DEVassos/greener-app/issues/112) | Expor o histórico de coletas na API | RF03, RF10 | DW03, BD02 | @LUCASAMR23 | mergeado em `develop` | [#116](https://github.com/DEVassos/greener-app/pull/116) |
| [#118](https://github.com/DEVassos/greener-app/issues/118) | Liberar CORS para o dashboard chamar a API | RF09 | DW03 | @DeaTuribio | mergeado em `develop` | [#119](https://github.com/DEVassos/greener-app/pull/119) |
| [#120](https://github.com/DEVassos/greener-app/issues/120) | Corrigir rolagem no celular e localização nula | RF09, RF12 | DW04 | @DeaTuribio | mergeado em `develop` | [#121](https://github.com/DEVassos/greener-app/pull/121) |
| [#103](https://github.com/DEVassos/greener-app/issues/103) | Documentar o cliente da API de carbono | RF07 | DW02, ES08 | @viniciusaugusto1997 | **aberta** | — |

### 3.3 Processo e gestão

| Issue | Título | Responsável | Situação em 15/10/2026 | PR |
|---|---|---|---|---|
| [#1](https://github.com/DEVassos/greener-app/issues/1) | Processo ágil, templates e automação do repositório (agilekit) | @travensolli | mergeado em `develop` | [#2](https://github.com/DEVassos/greener-app/pull/2), [#30](https://github.com/DEVassos/greener-app/pull/30), [#33](https://github.com/DEVassos/greener-app/pull/33), [#34](https://github.com/DEVassos/greener-app/pull/34) |
| [#3](https://github.com/DEVassos/greener-app/issues/3) | Plano de entregas e matriz de rastreabilidade | @henriqueptbd-cell | mergeado em `develop` | [#32](https://github.com/DEVassos/greener-app/pull/32) |
| [#4](https://github.com/DEVassos/greener-app/issues/4) | Padronizar as issues da Sprint 1 e publicar o backlog | @henriqueptbd-cell | mergeado em `develop` | [#75](https://github.com/DEVassos/greener-app/pull/75) |
| [#56](https://github.com/DEVassos/greener-app/issues/56) | Importar o histórico do Projeto-GreenER com autoria preservada | @travensolli | mergeado em `develop` | [#57](https://github.com/DEVassos/greener-app/pull/57) |
| [#59](https://github.com/DEVassos/greener-app/issues/59) | Preparar o repositório para o agilekit 2.0 | @travensolli | mergeado em `develop` | [#60](https://github.com/DEVassos/greener-app/pull/60) |
| [#70](https://github.com/DEVassos/greener-app/issues/70) | Sincronizar o repositório com o agilekit 2.2.0 | @travensolli | mergeado em `develop` | [#71](https://github.com/DEVassos/greener-app/pull/71) |
| [#72](https://github.com/DEVassos/greener-app/issues/72) | Atas das dailies — semana 1 | @travensolli | mergeado em `develop` | [#107](https://github.com/DEVassos/greener-app/pull/107) |
| [#73](https://github.com/DEVassos/greener-app/issues/73) | Atas das dailies — semana 2 | @travensolli | mergeado em `develop` | [#108](https://github.com/DEVassos/greener-app/pull/108) |
| [#78](https://github.com/DEVassos/greener-app/issues/78) | Publicar o registro da Sprint 1 (este documento) | @travensolli | mergeado em `develop`; revisado em 15/10 | [#79](https://github.com/DEVassos/greener-app/pull/79) |
| [#58](https://github.com/DEVassos/greener-app/issues/58) | Checklist de início por integrante | todos | **aberta** | — |
| [#74](https://github.com/DEVassos/greener-app/issues/74) | Daily — Sprint 1 (issue fixada) | @travensolli | **aberta** — fecha com o fim da sprint | — |
| [#102](https://github.com/DEVassos/greener-app/issues/102) | Atas das dailies — semana 3 | @travensolli | **aberta** — atas de 12 a 15/10 ainda não publicadas | — |
| [#117](https://github.com/DEVassos/greener-app/issues/117) | Burndown da Sprint 1 | @travensolli | **aberta** | — |

### 3.4 Itens movidos no replanejamento de 05/10

| Issue | Título | Destino | Motivo |
|---|---|---|---|
| [#45](https://github.com/DEVassos/greener-app/issues/45) | US04 — Dashboard executivo e operacional em tempo real | Sprint 2 | os KPIs (DW05) dependem do motor de cálculo, que saiu da Sprint 1 |
| [#6](https://github.com/DEVassos/greener-app/issues/6) | Seed com usuário administrador inicial | Sprint 2 | depende da autenticação JWT (DW06), prevista para a Sprint 2 |
| [#18](https://github.com/DEVassos/greener-app/issues/18) | Domain service do cálculo socioambiental | Sprint 2 | motor de cálculo (TP01) entregue como fatia vertical completa na Sprint 2 |
| [#20](https://github.com/DEVassos/greener-app/issues/20) | Autenticação JWT: login com bcrypt e middleware | Sprint 2 | DW06 previsto para a Sprint 2 |
| [#21](https://github.com/DEVassos/greener-app/issues/21) | Cards de KPIs executivos | Sprint 2 | KPIs dependem do motor de cálculo |
| [#25](https://github.com/DEVassos/greener-app/issues/25) | Tela de login e proteção de rotas privadas | Sprint 2 | DW06 previsto para a Sprint 2 |
| [#13](https://github.com/DEVassos/greener-app/issues/13) | Layout do relatório executivo para impressão e PDF | Sprint 3 | exportação é diferencial fora do edital (RP05 pede MVP) |
| [#24](https://github.com/DEVassos/greener-app/issues/24) | Exportação de dados em CSV e PDF | Sprint 3 | exportação é diferencial fora do edital (RP05 pede MVP) |

## 4. Responsáveis por integrante

Baseado na autoria dos PRs mergeados em `develop` (verificado em 15/10/2026):

| Integrante | Papel | Issues com PR de sua autoria | Linhas do plano |
|---|---|---|---|
| Henrique Camargo `@henriqueptbd-cell` | PO | #4, #7, #26, #65, #47 | ES01, ES03, ES04, ES08, ES09 |
| Gabriel Travensolli `@travensolli` | SM | #1, #3, #56, #59, #64, #66, #70, #72, #73, #78, #80, #109, #46 | ES02, ES05, ES06, ES07, ES08, ES09 |
| Andrea Turibio `@DeaTuribio` | dev frontend | #9, #10, #11, #12, #22, #23, #87, #104, #106, #118, #120 | DW01, DW04, TP02, ES09 |
| Lucas Amorim `@LUCASAMR23` | dev backend | #14, #15, #28, #111, #112, #16, #42 | DW01, DW02, DW03, DW07, BD02, TP02, ES09 |
| Vinicius Augusto `@viniciusaugusto1997` | dev banco de dados | #5, #8, #17, #19, #28, #97, #44, #103 | DW07, BD01, BD02, BD03, ES09 |

Todos os integrantes também respondem pela [#58](https://github.com/DEVassos/greener-app/issues/58) (checklist de início). Dois PRs foram fechados sem merge e substituídos por versões revisadas: [#90](https://github.com/DEVassos/greener-app/pull/90) (por [#95](https://github.com/DEVassos/greener-app/pull/95)) e [#93](https://github.com/DEVassos/greener-app/pull/93) (por [#94](https://github.com/DEVassos/greener-app/pull/94)).

## 5. Riscos em 15/10/2026

| Risco | Impacto | Resposta | Dono |
|---|---|---|---|
| [#16](https://github.com/DEVassos/greener-app/issues/16) é a única tarefa da sprint sem PR | DW02 fica **Parcial** se o mapeamento de erros ([RF05](../requisitos.md), [RF06](../requisitos.md), RNF04) não estiver em `develop` até o congelamento | PR antes de 17/10 ou registro do critério como Parcial no plano | Lucas |
| Histórias [#42](https://github.com/DEVassos/greener-app/issues/42), [#44](https://github.com/DEVassos/greener-app/issues/44), [#46](https://github.com/DEVassos/greener-app/issues/46) e [#47](https://github.com/DEVassos/greener-app/issues/47) abertas | critérios de aceite sem o "verificado" marcado reduzem ES03 e ES07 | fechar cada história até 17/10 com os critérios de aceite conferidos pelo revisor | Lucas, Vinicius, Gabriel, Henrique |
| Atas das dailies de 12 a 15/10 não publicadas ([#102](https://github.com/DEVassos/greener-app/issues/102)) | ES05 (distribuição ao longo da sprint) e ES09 (participação) perdem rastro | publicar as atas até 16/10 pelo PR semanal da semana 3 | Gabriel |
| `backend/README.md` e `database/README.md` descrevem implementações como "em revisão" que já estão mergeadas | ES08 está **Parcial** | atualizar os dois READMEs até 17/10 (PR próprio, fora deste) | Gabriel, Vinicius |
| `sprint-1/review.md` e `sprint-1/contribuicao.md` ainda não existem | ES06 e ES09 dependem dos dois arquivos | roteiro em 16/10, feedback registrado em até 24h depois da review, participação no fechamento | Gabriel, Henrique |
| Congelamento em 18/10 às 20h (`release/sprint-1` → `main`) | nada entra depois; só correção de docs e verificação | congelar com o plano e este registro atualizados | Gabriel |
