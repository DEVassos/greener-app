# Arquitetura — modelo de dados

Este documento registra o modelo persistente já definido em `database/schema.sql` para a Sprint 1. Ele descreve somente o DDL entregue nesta tarefa; backend, frontend e containers ainda não existem na branch de desenvolvimento.

## Fonte do modelo

`database/schema.sql` é a fonte única do esquema PostgreSQL. Ele usa DDL explícito e idempotente, sem ORM, e deve ser aplicado em banco vazio com `psql -v ON_ERROR_STOP=1 -f database/schema.sql`.

## Entidades e relações

```text
services (1) ────< (N) collections

users
```

| Tabela | Responsabilidade | Campos principais | Relações |
|---|---|---|---|
| `services` | Representa um serviço descoberto e seu último estado conhecido. | `external_id`, `name`, `status`, localização e timestamps de descoberta. | Possui zero ou muitas `collections`. |
| `collections` | Preserva cada leitura de métricas e dos valores ambientais associados. | `service_id`, `collected_at`, CPU, memória, disco, rede, potência, energia, CO₂e, `metrics` e `error_message`. | Pertence a um `service`. |
| `users` | Armazena credenciais para a área de configuração prevista. | `email`, `password_hash`, `created_at`, `updated_at`. | Não possui relação no DDL atual. |

## Regras de integridade

- `services.external_id` identifica cada serviço externo de forma única.
- Os estados de serviço permitidos são `ativo`, `indisponivel`, `sem_metricas` e `removido`.
- Latitude e longitude são opcionais, mas, quando presentes, respeitam seus limites geográficos.
- `collections.service_id` referencia `services.id` com `ON DELETE RESTRICT`: apagar um serviço não pode apagar seu histórico.
- Uma coleta registra métricas numéricas não negativas e seu estado é `ok`, `erro` ou `sem_metricas`.
- O índice `collections_service_collected_at_idx` atende consultas de histórico por serviço ordenadas da coleta mais recente para a mais antiga.
- E-mails de `users` são únicos sem diferenciar maiúsculas de minúsculas e a senha é armazenada apenas como hash bcrypt.

## Rastreabilidade

| Item | Evidência |
|---|---|
| Histórico de coletas | RF10 e tabela `collections`. |
| DDL explícito sem ORM | RP03 e `database/schema.sql`. |
| Modelo de dados, chaves e constraints | BD01 e `database/schema.sql`. |

Para instruções de aplicação e inspeção do banco, consulte [database/README.md](../database/README.md).
