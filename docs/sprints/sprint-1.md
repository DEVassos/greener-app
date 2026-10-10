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

## 3. Itens da milestone e situação em 08/10/2026

### 3.1 Histórias

| Issue | Título | Requisitos | Responsável | Situação |
|---|---|---|---|---|
| [#42](https://github.com/DEVassos/greener-app/issues/42) | US01 — Descoberta e ingestão dinâmica de serviços | RF01–RF06, RNF04 | @LUCASAMR23 | aberta; tarefas em andamento e a iniciar |
| [#44](https://github.com/DEVassos/greener-app/issues/44) | US03 — Modelagem e persistência em PostgreSQL (SQL puro) | RF10 | @viniciusaugusto1997 | aberta; schema mergeado, repositories a iniciar |
| [#45](https://github.com/DEVassos/greener-app/issues/45) | US04 — Dashboard executivo e operacional em tempo real | RF08, RF09, RF11, RNF01, RNF02 | @DeaTuribio | aberta; tabela mergeada, polling em andamento |
| [#46](https://github.com/DEVassos/greener-app/issues/46) | US05 — Infraestrutura e dockerização total | RNF05 | @travensolli | aberta; tarefas a iniciar |
| [#47](https://github.com/DEVassos/greener-app/issues/47) | US06 — Gestão e documentação da sprint | RNF05 | @henriqueptbd-cell | aberta |

### 3.2 Tarefas técnicas

| Issue | Título | Requisito | Critério | Responsável | Situação | PR |
|---|---|---|---|---|---|---|
| [#5](https://github.com/DEVassos/greener-app/issues/5) | Script DDL `schema.sql` para PostgreSQL | RF10 | BD01 | @LUCASAMR23 | mergeado em `develop` | [#77](https://github.com/DEVassos/greener-app/pull/77) |
| [#9](https://github.com/DEVassos/greener-app/issues/9) | Setup do projeto React com TypeScript, Vite e Tailwind | RNF01 | DW01, DW04 | @travensolli | mergeado em `develop` | [#62](https://github.com/DEVassos/greener-app/pull/62) |
| [#11](https://github.com/DEVassos/greener-app/issues/11) | Guia de estilos e design system dark mode | RNF01 | ES07 | @travensolli, @DeaTuribio | mergeado em `develop` | [#61](https://github.com/DEVassos/greener-app/pull/61) |
| [#22](https://github.com/DEVassos/greener-app/issues/22) | Tabela operacional de serviços com status e localização | RF09, RF12 | DW04 | @DeaTuribio | mergeado em `develop` | [#69](https://github.com/DEVassos/greener-app/pull/69) |
| [#28](https://github.com/DEVassos/greener-app/issues/28) | Modelagem UML (diagrama de classes / ERD) com Mermaid | — | BD01, DW01 | @LUCASAMR23, @viniciusaugusto1997 | mergeado em `develop` | [#57](https://github.com/DEVassos/greener-app/pull/57) |
| [#67](https://github.com/DEVassos/greener-app/issues/67) | ADR 0004: Vite e Tailwind CSS no frontend | RNF05 | ES08 | @travensolli | mergeado em `develop` | [#76](https://github.com/DEVassos/greener-app/pull/76) |
| [#8](https://github.com/DEVassos/greener-app/issues/8) | Setup da API REST Node.js com TypeScript e estrutura modular | — | DW01, DW03 | @LUCASAMR23 | em andamento | — |
| [#12](https://github.com/DEVassos/greener-app/issues/12) | Componente de indicador visual de última atualização | RNF02 | ES03 | @travensolli | em andamento | — |
| [#23](https://github.com/DEVassos/greener-app/issues/23) | Hook de polling e atualização sem recarregar | RF11, RNF02 | DW04 | @DeaTuribio | em andamento | — |
| [#7](https://github.com/DEVassos/greener-app/issues/7) | Variáveis de ambiente e `.env.example` | — | DW07 | @henriqueptbd-cell | a iniciar | — |
| [#10](https://github.com/DEVassos/greener-app/issues/10) | Protótipo de alta fidelidade no Figma | RNF01 | ES03 | @travensolli | a iniciar | — |
| [#14](https://github.com/DEVassos/greener-app/issues/14) | Repositories em SQL puro parametrizado | RF10 | BD02 | @LUCASAMR23 | a iniciar | — |
| [#15](https://github.com/DEVassos/greener-app/issues/15) | Cliente HTTP da API agregadora de métricas | RF01, RF03 | DW02, DW03 | @DeaTuribio, @LUCASAMR23 | a iniciar | — |
| [#16](https://github.com/DEVassos/greener-app/issues/16) | Tratamento de erros e mapeamento de status HTTP | RF05, RF06, RNF04 | DW02 | @LUCASAMR23 | a iniciar | — |
| [#17](https://github.com/DEVassos/greener-app/issues/17) | Cliente HTTP da API de intensidade de carbono | RF07 | DW02 | @viniciusaugusto1997 | a iniciar | — |
| [#19](https://github.com/DEVassos/greener-app/issues/19) | Worker de polling e reconciliação em background | RF02, RF04 | DW03 | @viniciusaugusto1997 | a iniciar | — |
| [#26](https://github.com/DEVassos/greener-app/issues/26) | Dockerfiles do backend e do frontend | — | DW07 | @travensolli | a iniciar | — |
| [#27](https://github.com/DEVassos/greener-app/issues/27) | `compose.yaml` com volume persistente do PostgreSQL | RNF05 | DW07, BD03 | @henriqueptbd-cell | a iniciar | — |
| [#64](https://github.com/DEVassos/greener-app/issues/64) | Conferir o Project Kanban e documentar seus campos | RNF05 | ES04, ES09 | @travensolli | a iniciar | — |
| [#65](https://github.com/DEVassos/greener-app/issues/65) | Atribuir responsáveis às histórias da Sprint 1 | RNF05 | ES09 | @henriqueptbd-cell | a iniciar | — |
| [#66](https://github.com/DEVassos/greener-app/issues/66) | Corrigir cor primária, tokens e nome EcoPulse no guia visual | RNF01 | — | @travensolli | a iniciar | — |

### 3.3 Processo e gestão

| Issue | Título | Responsável | Situação | PR |
|---|---|---|---|---|
| [#1](https://github.com/DEVassos/greener-app/issues/1) | Processo ágil, templates e automação do repositório (agilekit) | @travensolli | mergeado em `develop` | [#2](https://github.com/DEVassos/greener-app/pull/2), [#30](https://github.com/DEVassos/greener-app/pull/30), [#33](https://github.com/DEVassos/greener-app/pull/33), [#34](https://github.com/DEVassos/greener-app/pull/34) |
| [#3](https://github.com/DEVassos/greener-app/issues/3) | Plano de entregas e matriz de rastreabilidade | @henriqueptbd-cell | mergeado em `develop` | [#32](https://github.com/DEVassos/greener-app/pull/32) |
| [#4](https://github.com/DEVassos/greener-app/issues/4) | Padronizar as issues da Sprint 1 e publicar o backlog | @henriqueptbd-cell | mergeado em `develop` | [#75](https://github.com/DEVassos/greener-app/pull/75) |
| [#56](https://github.com/DEVassos/greener-app/issues/56) | Importar o histórico do Projeto-GreenER com autoria preservada | @travensolli | mergeado em `develop` | [#57](https://github.com/DEVassos/greener-app/pull/57) |
| [#59](https://github.com/DEVassos/greener-app/issues/59) | Preparar o repositório para o agilekit 2.0 | @travensolli | mergeado em `develop` | [#60](https://github.com/DEVassos/greener-app/pull/60) |
| [#70](https://github.com/DEVassos/greener-app/issues/70) | Sincronizar o repositório com o agilekit 2.2.0 | @travensolli | mergeado em `develop` | [#71](https://github.com/DEVassos/greener-app/pull/71) |
| [#58](https://github.com/DEVassos/greener-app/issues/58) | Checklist de início por integrante | todos | aberta | — |
| [#72](https://github.com/DEVassos/greener-app/issues/72), [#73](https://github.com/DEVassos/greener-app/issues/73) | Atas das dailies — semanas 1 e 2 | @travensolli | a iniciar | — |
| [#78](https://github.com/DEVassos/greener-app/issues/78) | Publicar o registro da Sprint 1 (este documento) | @travensolli | em andamento | — |

### 3.4 Itens movidos no replanejamento de 05/10

| Issue | Título | Destino | Motivo |
|---|---|---|---|
| [#6](https://github.com/DEVassos/greener-app/issues/6) | Seed com usuário administrador inicial | Sprint 2 | depende da autenticação JWT (DW06), prevista para a Sprint 2 |
| [#18](https://github.com/DEVassos/greener-app/issues/18) | Domain service do cálculo socioambiental | Sprint 2 | motor de cálculo (TP01) entregue como fatia vertical completa na Sprint 2 |
| [#20](https://github.com/DEVassos/greener-app/issues/20) | Autenticação JWT: login com bcrypt e middleware | Sprint 2 | DW06 previsto para a Sprint 2 |
| [#21](https://github.com/DEVassos/greener-app/issues/21) | Cards de KPIs executivos | Sprint 2 | KPIs dependem do motor de cálculo |
| [#25](https://github.com/DEVassos/greener-app/issues/25) | Tela de login e proteção de rotas privadas | Sprint 2 | DW06 previsto para a Sprint 2 |
| [#13](https://github.com/DEVassos/greener-app/issues/13) | Layout do relatório executivo para impressão e PDF | Sprint 3 | exportação é diferencial fora do edital (RP05 pede MVP) |
| [#24](https://github.com/DEVassos/greener-app/issues/24) | Exportação de dados em CSV e PDF | Sprint 3 | exportação é diferencial fora do edital (RP05 pede MVP) |

## 4. Responsáveis por integrante

| Integrante | Papel | Itens da Sprint 1 | Linhas do plano |
|---|---|---|---|
| Henrique Camargo `@henriqueptbd-cell` | PO | #3, #4, #7, #27, #47, #65 | ES01, ES03, ES04, ES08, ES09 |
| Gabriel Travensolli `@travensolli` | SM | #1, #9, #10, #11, #12, #26, #46, #56, #59, #64, #66, #67, #70, #72, #73, #74, #78 | ES02, ES05, ES06, ES07, ES08, ES09 |
| Andrea Turibio `@DeaTuribio` | dev frontend | #11, #15, #22, #23, #45 | DW01, DW04, TP02, ES09 |
| Lucas Amorim `@LUCASAMR23` | dev backend | #5, #8, #14, #15, #16, #28, #42 | DW01, DW02, DW03, DW07, BD02, TP02, ES09 |
| Vinicius Augusto `@viniciusaugusto1997` | dev banco de dados | #17, #19, #28, #44 | DW07, BD01, BD02, BD03, ES09 |

Todos os integrantes também respondem pela [#58](https://github.com/DEVassos/greener-app/issues/58) (checklist de início).

## 5. Riscos em 08/10/2026

| Risco | Impacto | Resposta | Dono |
|---|---|---|---|
| `backend/` ainda não está em `develop`; [#8](https://github.com/DEVassos/greener-app/issues/8) sem commits até 08/10 | DW02 sai da sprint se `GET /services` e `GET /collections` não entrarem até 11/10; DW03, BD02, BD03 e TP02 dependem do mesmo código | em tratativa com Lucas e Vinicius desde 08/10; decisão registrada no histórico do plano no checkpoint de 09/10 | Lucas, Vinicius; decisão de Henrique e Gabriel |
| Infraestrutura Docker não iniciada ([#7](https://github.com/DEVassos/greener-app/issues/7), [#26](https://github.com/DEVassos/greener-app/issues/26), [#27](https://github.com/DEVassos/greener-app/issues/27)) | DW07 e BD03 dependem de `compose.yaml`, Dockerfiles e `.env.example` | iniciar os três itens logo após o checkpoint | Gabriel, Henrique |
| Atas das dailies ainda não publicadas | rastro das dailies da sprint no GitHub | atas registradas com `/daily` a partir de 09/10 e PR semanal pelas issues #72 e #73 | Gabriel |
| Andrea e Vinicius ainda sem revisão em PR de colega | mínimo do papel de dev para ES09 ([processo § 1.1](../processo/README.md#11-cartão-de-participação-por-papel-mínimos-verificáveis-por-sprint)) | revisores dos próximos PRs de backend e frontend | Andrea, Vinicius |
