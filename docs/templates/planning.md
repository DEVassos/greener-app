# Sprint Planning — Sprint N

<!-- Template do agilekit (repo/docs/templates/planning.md). Destino: docs/sprints/sprint-N/planning.md. Escrito pelo SM durante a planning e publicado por PR no MESMO dia (ES02). Substitua os campos `<...>`. -->

| Campo | Valor |
|---|---|
| Data e local | `<dd/mm/aaaa>`, `<sala de aula / chamada online>`, `<hh:mm–hh:mm>` (90 min) |
| Presentes | @henriqueptbd-cell (PO), @travensolli (SM), @DeaTuribio, @LUCASAMR23, @viniciusaugusto1997 |
| Ausentes | `<@login — motivo>` ou nenhum |
| Período da sprint | `<dd/mm>` a `<dd/mm/aaaa>` · checkpoint `<dd/mm>` · congelamento `<dd/mm>` 20h · review `<dd/mm>` 19h30 (a confirmar) |
| Milestone | `Sprint N` |

## 1. Objetivo da sprint

`<uma ou duas frases que o cliente entende; copiado para sprint-N.md e para o plano de entregas>`

## 2. Capacidade

| Integrante | Dias disponíveis | Ausências previstas | Observações |
|---|---|---|---|
| @DeaTuribio | `<n>` | `<datas>` | frontend |
| @LUCASAMR23 | `<n>` | `<datas>` | backend |
| @viniciusaugusto1997 | `<n>` | `<datas>` | banco de dados |
| @henriqueptbd-cell | `<n>` | `<datas>` | PO: histórias, aceite, plano |
| @travensolli | `<n>` | `<datas>` | SM: atas, quadro, CI |

Feriados no período: `<12/10, 15/10 ...>` (daily assíncrona). Capacidade total estimada: `<pontos>`.

## 3. Itens selecionados (Sprint Backlog)

| Issue | Título | Requisito | Critério | Responsável | Estimativa | DoR |
|---|---|---|---|---|---|---|
| #`<n>` | `<título>` | RF01 | DW02 | @LUCASAMR23 | 3 | ok |
| #`<n>` | `<título>` | RF10 | BD01 | @viniciusaugusto1997 | 3 | ok |

Total selecionado: `<pontos>` (≤ capacidade). Itens could, puxados se sobrar capacidade: #`<n>`, #`<n>`.

## 4. Critérios da rubrica previstos e denominador

| Código | Pontos | Entrega que o comprova | Responsável |
|---|---|---|---|
| ES01–ES09 | 40 | processo e registros da sprint | PO + SM + todos (ES09) |
| DW01 | 3 | módulos frontend/backend em TypeScript | @DeaTuribio, @LUCASAMR23 |
| `<DWxx>` | `<p>` | `<entrega>` | `<@login>` |

**Denominador da sprint:** `<soma>` pontos. Gatilhos de replanejamento: `<critério → sprint seguinte se X não estiver em develop até dd/mm>`.

## 5. Riscos e dependências

| Risco | Impacto | Mitigação | Dono |
|---|---|---|---|
| `<ex.: API auxiliar instável>` | `<alto/médio/baixo>` | `<ex.: timeout + estado "indisponível">` | `<@login>` |

## 6. Decisões da planning

- `<decisão técnica ou de escopo, com link para ADR ou issue quando houver>`
- Par de revisão da sprint: `<@a ↔ @b, @c ↔ @d, ...>`

## 7. Encaminhamentos

- [ ] Issue fixada "Daily — Sprint N" criada (@travensolli)
- [ ] `docs/sprints/sprint-N.md` inicial criado (@travensolli)
- [ ] Linhas da Sprint N no plano de entregas revisadas (@henriqueptbd-cell)
- [ ] `docs/backlog/product-backlog.md` regenerado (@travensolli)
