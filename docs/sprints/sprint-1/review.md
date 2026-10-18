# Sprint Review — Sprint 1

| Campo | Valor |
|---|---|
| Data e horário | 19/10/2026 19h30 (previsto no calendário da sprint; confirmação do cliente pendente) |
| Local | A combinar com o cliente — Fatec Jacareí ou chamada online |
| Participantes do time | @henriqueptbd-cell (PO), @travensolli (SM, escriba), @DeaTuribio, @LUCASAMR23, @viniciusaugusto1997 |
| Cliente / avaliadores | UniLaunch (cliente) e Fatec Jacareí (avaliação da entrega) |
| Versão demonstrada | branch `release/sprint-1` (congelamento de 18/10/2026 20h); roteiro ensaiado em `develop` no commit [`16d520f`](https://github.com/DEVassos/greener-app/commit/16d520f1008c629e4a5f8b5a9f519da1881d3626) |
| Ambiente | `docker compose up --build` neste clone (containers `ecopulse-*`, PostgreSQL 16); ensaio em 18/10/2026 |

## 1. Objetivo da sprint e resultado

**Objetivo:** pipeline de coleta persistido em Docker e primeira tela apresentável do dashboard — o backend descobre os serviços no agregador, coleta métricas e grava o histórico no PostgreSQL; o frontend lista os serviços com estado e localização, atualizando sem recarregar a página; a aplicação inteira sobe com `docker compose up --build`.

**Resultado apurado no ensaio de 18/10/2026:** o fluxo de ponta a ponta funciona — 8 serviços descobertos e coletados, energia e CO₂e calculados para todos e dashboard atualizando a cada 30 s. Situação dos critérios previstos: ES01–ES05, ES07, DW01–DW04, DW07, BD01–BD03 e TP02 concluídos; ES08 parcial (READMEs de módulo) e ES06/ES09 em andamento até o pós-review. O aceite do cliente na review de 19/10/2026 é registrado nas seções 3 a 5.

## 2. Roteiro da demonstração (por requisito)

| Ordem | Requisito | O que será mostrado | Como (URL, comando, consulta) | Quem demonstra | Tempo |
|---|---|---|---|---|---|
| 1 | RF01 | Serviços descobertos no agregador | `GET http://localhost:3000/api/services` | @LUCASAMR23 | 3 min |
| 2 | RF10 | Histórico de coletas persistido | clique na linha do serviço em `http://localhost:5173`; `SELECT ... FROM collections` | @viniciusaugusto1997 | 3 min |
| 3 | RF09, RF12 | Tela de serviços com estado e localização atualizando sozinha | `http://localhost:5173` (cabeçalho "Última atualização" e intervalo) | @DeaTuribio | 4 min |
| 4 | RF07 | Energia (kWh) e Emissão (g CO₂e) estimadas por serviço | colunas `Energia (kWh)` e `Emissão (g CO₂e)` em `http://localhost:5173`; `GET /api/services` | @henriqueptbd-cell | 4 min |
| 5 | — | Backlog, plano de entregas e próximos passos | issues e `docs/plano-de-entregas.md` | @henriqueptbd-cell | 3 min |
| 6 | — | Processo: quadro, atas e DoD aplicada | GitHub Project e `docs/sprints/` | @travensolli | 3 min |

Regra: cada integrante demonstra ≥1 item.

### 2.1 Resultado observado no ensaio de 18/10/2026

1. **Subida.** `docker compose up --build` terminou com `backend`, `frontend` e `postgres` em `Up (healthy)`; `GET http://localhost:3000/health` respondeu `{"status":"ok","db":"ok"}`.
2. **Descoberta e coleta (RF01).** `GET /api/services` devolveu 8 serviços; o primeiro, `Audit Stream`, com `energyKwh: 0.000535939903`, `emissionsG: 0.24921205505`, `status: "ativo"` e `lastReadingAt: "2026-10-18T11:05:02.371Z"`.
3. **Dashboard (RF09, RF12, DW05).** `http://localhost:5173` exibiu os 8 serviços, todos `Ativo`, com "Última atualização: 18/10 08:05:27 · intervalo: 30 s"; a tabela mostra `Energia (kWh)` e `Emissão (g CO₂e)` preenchidas. Print em [`docs/img/sprint-1-dashboard-energia-co2e.png`](../../img/sprint-1-dashboard-energia-co2e.png) — dashboard de 18/10/2026 com os 8 serviços coletados, as colunas de energia e emissão preenchidas e o intervalo de atualização visível.
4. **Histórico (RF10).** `GET /api/collections?service_id=5&limit=3` devolveu a coleta de `2026-10-18T11:05:02.371Z` com `status: "ok"`, `cpuPercent: 53.61`, `memoryGb: 3.108928`, `diskGb: 33.18784` e `networkGb: 0.87604`; `SELECT count(*) FROM collections` = 9 depois de ~1 min.
5. **Falha da API de carbono.** Com `CARBON_API_URL=http://127.0.0.1:9 docker compose up -d --force-recreate backend`, a coleta seguinte manteve `status: "ok"` e `calculation_status: "indisponivel"`, com `energy_kwh` e `co2e_grams` `NULL` e a mensagem "Não foi possível obter uma intensidade de carbono válida para a região."; `GET /api/services` devolveu `energyKwh: null` e `emissionsG: null` com `status: "ativo"`. Restaurado o backend com o `.env` normal, a coleta seguinte voltou a `calculation_status: "disponivel"` com energia e emissão preenchidas (ex.: `0.000308407976` kWh e `0.012336319053` g).

## 6. Encaminhamentos pós-review (≤24h)

- [ ] Seção Review de `docs/sprints/sprint-1.md` preenchida (@travensolli)
- [ ] Issues `feedback-cliente` criadas na milestone Sprint 2 (@henriqueptbd-cell)
- [ ] Plano de entregas: Situação verificada e histórico atualizado (@henriqueptbd-cell)
- [ ] Merge de `release/sprint-1` em `main`, tag `sprint-1` e GitHub Release (@travensolli)

As seções 3 a 5 do template (feedback do cliente, decisões e alterações no backlog, pendências) são registradas pelo SM em até 24h após a review de 19/10/2026.
