# ADR 0002 — PostgreSQL com driver `pg` e SQL explícito, sem ORM

| Campo | Valor |
|---|---|
| Status | aceito |
| Data | 2026-10-05 |
| Decisores | @viniciusaugusto1997 (db), @LUCASAMR23 (backend), @travensolli (SM); validado pelo time |
| Rastreabilidade | requisito RP03 (PostgreSQL, DDL/DML explícitos, sem ORM) · critérios BD01 (modelo e DDL), BD02 (DML parametrizado), DW03 (repositories) |

## Contexto e problema

O edital exige PostgreSQL com uso explícito de DDL e DML e **proíbe ORM** (RP03). A rubrica verifica o `schema.sql` executando-o em um banco vazio (BD01) e procura, nos repositories, SQL com placeholders e valores enviados separadamente ao driver, sem concatenação (BD02, 6 pontos). Também exige que o acesso ao banco fique concentrado nos repositories (DW03). Precisamos escolher como o backend Node.js/TypeScript conversa com o banco e onde o esquema vive.

## Fatores de decisão

- Conformidade literal com RP03: nenhuma dependência de ORM ou query builder que esconda o SQL.
- SQL legível pelo avaliador no próprio repositório, com `$1…$n`.
- Esquema reproduzível em banco vazio por um único comando.
- Tipagem forte dos resultados (TP02) sem gerar código.
- Curva de aprendizado compatível com três semanas por sprint.

## Opções consideradas

1. **Driver `pg` (node-postgres) + SQL explícito em `*.repository.ts` + `database/schema.sql` como fonte única.**
2. Query builder (`knex`) com migrações geradas.
3. ORM (`prisma`, `typeorm`, `sequelize`, `drizzle`).

## Decisão

Adotamos a **opção 1**:

- Dependência única de acesso a dados: `pg` (e `@types/pg`). `backend/src/db/connection.ts` exporta um `Pool` configurado por `DATABASE_URL`.
- **O SQL inteiro fica em `backend/src/modules/<recurso>/<recurso>.repository.ts`**, como strings constantes com placeholders `$1…$n`; valores vão no array de parâmetros de `pool.query(text, values)`. Services e controllers não importam `pg`.
- Interpolação (`${}`) ou concatenação de valores no texto SQL é proibida; o check `pr` (`check-forbidden.sh`) avisa em `query(` com `${`/`+` e recusa dependências de ORM no `package.json`. Casos legítimos (ex.: nome de coluna de ordenação validado contra uma lista fixa) levam o comentário `// sql-seguro: <motivo>`.
- **`database/schema.sql` é a fonte única do esquema** (tabelas, tipos, PK, FK, `CHECK`, `UNIQUE`, índices), aplicado pelo container PostgreSQL na primeira inicialização e executável com `psql -f` em banco vazio. Evoluções a partir da Sprint 2 entram como `database/migrations/NNN-slug.sql` numerados e idempotentes, documentados em `database/README.md`.
- Resultados tipados com interfaces TypeScript por linha (`interface ServiceRow {...}`) e mapeados para as classes de domínio no service.

## Consequências

**Positivas**
- O avaliador vê o SQL completo e os placeholders no arquivo; BD02 fica verificável por `grep`.
- `schema.sql` executa sozinho em banco vazio (BD01) e documenta o modelo sem ferramenta intermediária.
- Sem geração de código nem camada mágica: o que está no arquivo é o que roda.
- Consultas analíticas (BD04: `GROUP BY`, `SUM`, janelas por período) escritas diretamente, sem lutar contra a abstração.

**Negativas / custos**
- Mais código repetitivo (mapeamento linha → objeto) — mitigado com funções pequenas de mapeamento por módulo.
- Disciplina manual para manter `schema.sql`, `database/README.md` e `docs/arquitetura.md` sincronizados — coberta pelo item 5 da DoD-PR.
- Sem migrações automáticas: alterações de esquema exigem script numerado e teste em banco vazio no CI (`ci.yml`).

## Prós e contras das opções

### Opção 2 — `knex`
- Bom: migrações e placeholders prontos.
- Ruim: o SQL fica parcialmente escondido na API fluente; zona cinzenta com RP03; o check avisa sobre `knex`.

### Opção 3 — ORM
- Bom: produtividade e tipagem gerada.
- Ruim: **proibido pelo edital**; DDL gerado, não explícito; BD01/BD02 ficariam "não atendidos".

## Links

- Requisito: [RP03](../requisitos.md) · Critérios BD01/BD02 no [plano de entregas](../plano-de-entregas.md)
- Modelos: [`docs/templates/database-README.md`](../templates/database-README.md) · [`docs/templates/arquitetura.md`](../templates/arquitetura.md)
- Verificador: [`.github/scripts/check-forbidden.sh`](../../.github/scripts/check-forbidden.sh)
- Documentação: https://node-postgres.com
