# Banco de dados

O GreenER usa PostgreSQL e SQL explícito. O arquivo [schema.sql](schema.sql) é a fonte única do modelo de dados; não há ORM nem gerador de migrações neste repositório.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `schema.sql` | DDL idempotente das tabelas, constraints, índices e comentários do banco. |

## Aplicar em um banco vazio

O schema exige PostgreSQL 10 ou superior, por usar colunas `GENERATED ALWAYS AS IDENTITY`.

Com uma instância local de desenvolvimento, crie um banco vazio e aplique o DDL com interrupção na primeira falha:

```bash
createdb greener_db
psql -v ON_ERROR_STOP=1 -d greener_db -f database/schema.sql
```

Para conferir o resultado:

```bash
psql -d greener_db -c "\\dt"
psql -d greener_db -c "\\d collections"
psql -d greener_db -c "SELECT count(*) FROM collections;"
```

Para recriar somente o banco de desenvolvimento local:

```bash
dropdb greener_db
createdb greener_db
psql -v ON_ERROR_STOP=1 -d greener_db -f database/schema.sql
```

O `compose.yaml` ainda não existe na branch de desenvolvimento. Quando a infraestrutura PostgreSQL for entregue, ela deverá montar este diretório em `/docker-entrypoint-initdb.d/` e documentar as variáveis de conexão no mesmo PR.

## Modelo de dados

| Tabela | Finalidade | Integridade principal |
|---|---|---|
| `services` | Serviços descobertos pela API de métricas e seu estado atual. | `external_id` único; status controlado; coordenadas válidas. |
| `collections` | Uma linha imutável por coleta de métricas de um serviço. | FK para `services` com `ON DELETE RESTRICT`; status de coleta; números não negativos; índice por serviço e instante. |
| `users` | Credenciais da futura área de configuração. | E-mail único sem diferenciar maiúsculas/minúsculas; hash bcrypt de 60 caracteres. |

As coletas não devem ser sobrescritas: cada execução da coleta deverá inserir uma nova linha em `collections` para preservar o histórico do RF10.

## DML e consultas

Ainda não há backend nem repositories nesta branch. Quando eles forem criados, toda DML ficará exclusivamente em `backend/src/modules/*/*.repository.ts`, usando o driver `pg`, placeholders `$1...$n` e valores em array separado. SQL com ORM, query builder, interpolação ou concatenação de dados variáveis é proibido.

O modelo de dados e as relações estão detalhados em [docs/arquitetura.md](../docs/arquitetura.md).
