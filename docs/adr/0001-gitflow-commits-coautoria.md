# ADR 0001 — Git Flow, Conventional Commits em pt-BR e co-autoria restrita ao time

| Campo | Valor |
|---|---|
| Status | aceito |
| Data | 2026-10-05 |
| Decisores | @henriqueptbd-cell (PO), @travensolli (SM), @DeaTuribio, @LUCASAMR23, @viniciusaugusto1997 |
| Rastreabilidade | requisito RP07 (gestão ágil) · critérios ES04 (rastreabilidade), ES05 (evolução incremental), ES09 (participação) |

## Contexto e problema

A rubrica avalia apenas o que está no GitHub e precisa relacionar requisito, issue, commit, PR e entrega (ES04), ver desenvolvimento distribuído ao longo da sprint (ES05) e atribuir contribuição a cada integrante (ES09, coletivo: zera se alguém ficar sem evidência). O avaliador abre o repositório na branch padrão e espera uma versão estável por sprint. Sem convenção, commits sem referência à issue, merges por squash (que apagam a autoria individual) e co-autores externos (bots, IA) tornariam a avaliação imprecisa ou injusta com o time.

## Fatores de decisão

- Cada commit precisa ser atribuível a um integrante e a uma issue.
- `main` precisa refletir a versão entregue em cada sprint (tag) sem bloquear a integração contínua do time.
- As regras devem ser verificáveis automaticamente (hooks locais, hook do Claude Code, checks do CI), não só combinadas.
- O time já usou Git Flow com `develop`, Conventional Commits em pt-BR e revisão obrigatória no semestre anterior.

## Opções consideradas

1. **Git Flow simplificado**: `main` (estável, release por sprint) + `develop` (integração) + branches de trabalho com número da issue; merge commit; tags `sprint-N`.
2. **GitHub Flow**: só `main` + branches curtas; deploy contínuo; release = tag em `main`.
3. **Trunk-based com squash**: commits diretos ou PRs com squash em uma única branch.

## Decisão

Adotamos a **opção 1**, com estas regras (detalhadas em [`.github/CONTRIBUTING.md`](../../.github/CONTRIBUTING.md)):

- `main` e `develop` protegidas por ruleset: sem push direto, PR com 1 aprovação de alguém ≠ autor e checks `commits`, `pr`, `docs` verdes.
- Branches `feature|fix|docs|chore|test|sql/<nº-issue>-slug` a partir de `origin/develop`; `release/sprint-N` e `hotfix/<n>-slug` são as únicas que entram em `main`; branch apagada no merge.
- Commits `type(scope): descrição no imperativo (#n) [RFxx]`, pt-BR, assunto ≤72 caracteres, `#n` obrigatório.
- **Merge commit apenas** (squash e rebase desabilitados no repositório).
- `Co-authored-by` opcional e **restrito a integrantes de `.github/equipe.json`**; qualquer outro co-autor (IA, bot, externo) é recusado pelo hook e pelo CI. Uso de IA é declarado no PR, não no commit.
- Tag anotada `sprint-N` em `main` a cada fechamento, imutável por ruleset, com GitHub Release apontando para `docs/sprints/sprint-N.md`.

## Consequências

**Positivas**
- Cadeia RF → issue → branch → commit → PR → tag verificável por `grep` e pela interface do GitHub.
- Autoria individual preservada no histórico (merge commit), base objetiva para ES09.
- `main` sempre demonstrável; `develop` absorve a integração diária sem risco para a entrega avaliada.
- Regras aplicadas por máquina: menos discussão em revisão, menos retrabalho.

**Negativas / custos**
- Mais branches e um passo extra (release) por sprint — mitigado pela skill `/sprint N congelar|fechar`.
- O `Closes #n` nativo só fecha a issue em merge na branch padrão; em `develop` quem fecha é o workflow `board` ([quadro.md](../processo/quadro.md)).
- Mudanças em `.github/workflows` precisam de PR para `develop` e para `main`.
- Histórico com merge commits é mais verboso que squash — aceitável porque a autoria vale mais que a linearidade.

## Prós e contras das opções

### Opção 2 — GitHub Flow
- Bom: simples; menos branches.
- Ruim: `main` recebe trabalho parcial no meio da sprint; a versão avaliada se confunde com a integração; releases por sprint ficam frágeis.

### Opção 3 — Trunk-based com squash
- Bom: histórico linear e curto.
- Ruim: squash apaga a autoria por integrante (ES09) e a evolução incremental (ES05); commits diretos eliminam a revisão obrigatória.

## Links

- [`.github/CONTRIBUTING.md`](../../.github/CONTRIBUTING.md) · [`docs/processo/README.md`](../processo/README.md) · [`.github/rulesets/`](../../.github/rulesets/)
- Requisito: [RP07](../requisitos.md) · Plano: [plano de entregas](../plano-de-entregas.md)
