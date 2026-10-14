# Banco de dados

Contribuição local da #14: DML parametrizada em `backend/src/modules/services/services.repository.ts`, `collections/collections.repository.ts` e no módulo existente `usuarios/usuarios.repository.ts`. Transações em `backend/src/db/transaction.repository.ts`, sempre em uma conexão reservada do pool. Schema/UML inalterados; histórico somente por inserção, sem exclusão física ou sobrescrita de coletas. Contratos e fixture de verificação descartável no [README backend](../backend/README.md#repositories--contribuição-local-da-14). Nenhum worker, cálculo ou autenticação implementado nesta contribuição.

SQL explícito PostgreSQL, sem ORM. O schema de Lucas (#5/#44) foi integrado localmente à UML; implementação e publicação permanecem em revisão. [Modelo](../docs/arquitetura/modelagem-uml.md), [decisões/fontes](../docs/arquitetura/integracao-modelagem-banco.md) e [cálculos](../docs/calculos.md).

## Arquivos e ordem

`database/schema.sql` é a fonte única de inicialização: services, users, collections e access_entries, constraints, índices e comentários em uma transação. Exige PostgreSQL 14 ou superior (numeric com valores especiais nos CHECKs); o compose usa `postgres:16-alpine`. Ainda não há seeds.

## Execução pelo compose (#27)

A execução oficial é exclusivamente Docker (RP04, ADR 0003). O serviço `postgres` do [`compose.yaml`](../compose.yaml):

- monta esta pasta em `/docker-entrypoint-initdb.d/` (somente leitura). Na **primeira** criação do volume, o entrypoint do PostgreSQL executa os `.sql` daqui em ordem alfabética, hoje só `schema.sql`, e ignora o `README.md`;
- guarda os dados no volume nomeado `pgdata` (`/var/lib/postgresql/data`). Eles sobrevivem a `docker compose restart`, `stop` e `down`; só `docker compose down -v` apaga o volume (BD03);
- tem healthcheck `pg_isready`, e o backend só sobe depois dele (`depends_on: condition: service_healthy`);
- atende em `postgres:5432` dentro da rede do compose (é o endereço que o backend usa) e fica exposto no host na porta `POSTGRES_HOST_PORT` (padrão e exemplo: 5433, para não conflitar com um PostgreSQL local na 5432). Se a 5433 estiver ocupada, troque no `.env`; a porta interna não muda.

Para acessar do host (psql local, DBeaver): `psql -h localhost -p 5433 -U greener -d greener_db` (ou a porta definida em `POSTGRES_HOST_PORT`).

Usuário, senha e banco vêm de `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` no `.env` (padrão `greener` / `greener` / `greener_db`, os mesmos do [`.env.example`](../.env.example)). Eles só valem na criação do volume: para trocar, `docker compose down -v`.

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec postgres psql -U greener -d greener_db -c '\dt'
docker compose exec postgres psql -U greener -d greener_db -c 'SELECT count(*) FROM collections;'
```

Esperado: as quatro tabelas (`access_entries`, `collections`, `services`, `users`) e a contagem do histórico. No log (`docker compose logs postgres`) aparece `running /docker-entrypoint-initdb.d/schema.sql` só na primeira subida.

Persistência (BD03): insira um registro, reinicie e conte de novo.

```bash
docker compose exec postgres psql -U greener -d greener_db -c "INSERT INTO services (external_id, name) VALUES ('svc-persist', 'Persistência');"
docker compose restart
docker compose exec postgres psql -U greener -d greener_db -c 'SELECT count(*) FROM services;'
```

Esperado: a contagem continua `1` depois de `restart` e de `down` seguido de `up`. Depois de `docker compose down -v` e nova subida, volta a `0`, porque o schema é reaplicado num volume novo.

Mudar `schema.sql` não altera um volume que já existe (os scripts de init só rodam no volume vazio). Em desenvolvimento, recrie com `docker compose down -v`; em banco com dados, use migração numerada (ADR 0002).

## Verificação isolada do DDL

Para verificar somente o DDL em um container descartável, sem portas ou volumes e sem remover containers existentes, use Git Bash; neste ambiente o Docker fica no WSL. O nome abaixo deve estar livre e deve identificar somente o container criado por este procedimento.

```bash
wsl --exec docker run -d --rm --name ecopulse-schema-check --network none -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16
wsl --exec docker exec ecopulse-schema-check pg_isready -U postgres
# Aguarde pg_isready informar accepting connections antes de aplicar.
wsl --exec docker exec -i ecopulse-schema-check psql -U postgres -v ON_ERROR_STOP=1 < database/schema.sql
wsl --exec docker exec ecopulse-schema-check psql -U postgres -c '\\dt'
wsl --exec docker exec ecopulse-schema-check psql -U postgres -c 'SELECT count(*) FROM collections;'
# Após a verificação, pare somente o container descartável criado acima.
wsl --exec docker stop ecopulse-schema-check
```

Sem rede/portas/volume, trust fica limitado a esse container temporário; não é configuração de produção nem muda .env.example. Esperado: quatro tabelas, histórico vazio e DDL sem erros; reaplicar o mesmo schema mantém dados existentes do mesmo modelo.

## Modelo de dados

| Tabela | Finalidade | Integridade |
|---|---|---|
| services | Cadastro descoberto e estado atual, incluindo region_code. | ID externo único; coordenadas válidas; timestamps. |
| collections | Histórico de métricas em GB, intervalo e contexto regional; resultados quando disponíveis. | FK RESTRICT; status de métricas separado do cálculo; métricas completas para ok; NULL para desconhecido. |
| users | Credenciais administrativas para configuração e consulta futura das entradas. | E-mail único sem diferenciar caixa; hash bcrypt. Sem quatro perfis ou tenants. |
| access_entries | IP e instante da primeira entrada por sessão da aba. | IP INET e horário TIMESTAMPTZ obrigatórios; índice temporal; sem FK de usuário ou dados HTTP. |

Os estados e nulabilidade completos constam na UML e nos CHECKs. Falha de carbono preserva métricas válidas; cálculo indisponível exige mensagem própria e não fabrica emissão zero. JSONB contém objeto bruto de /metrics; campos normalizados são a interface do modelo, e JSON não substitui validação no futuro backend.

Energia numeric(20,12) e emissão numeric(24,12) aumentam a resolução para 10⁻¹² sem reduzir a faixa inteira anterior. Exemplos e limites: docs/calculos.md. O schema possui quatro índices explícitos e cinco automáticos (quatro PKs e UNIQUE de services.external_id), totalizando nove. Roteiro reproduzível dos testes: [verificação do schema](../docs/arquitetura/verificacao-schema.md).

## Inicialização não é migração

IF NOT EXISTS não altera tabelas existentes. O guard rejeita collections da versão anterior com colunas bytes ou sem calculation_status, em vez de reinterpretar dados como GB. Não se executou migração nem se consultou banco do usuário para testes. Outros desvios de um esquema existente também exigem inspeção; reaplicação não certifica equivalência de um banco arbitrário.

Um banco criado com a revisão anterior em GB/escala seis também é recusado pelo guard e requer migração explícita para ampliar energy_kwh/co2e_grams. Alterar apenas este arquivo não modifica os tipos existentes nem recupera valores anteriormente arredondados para zero; não foi executada migração em banco real.

Evolução em banco populado exige script database/migrations/NNN-slug.sql conforme ADR 0002, documentação, backup e teste de preservação. Conversão de bytes exige comprovar unidade e origem; o nome da coluna não comprova o fator. Nenhuma conversão silenciosa ou DROP/TRUNCATE foi incluída.

## Responsabilidades futuras

DML apenas em backend/src/modules/*/*.repository.ts, driver pg e parâmetros $1…$n. Não há repositories nesta branch. Cada coleta será INSERT novo; FK protege serviços referenciados, mas não torna collections tecnicamente imutável. UPDATEs de services/users deverão atribuir updated_at = now(); o default só atua na inserção.

Consulta de entradas será autenticada por JWT no backend, com credenciais administrativas existentes, filtros por período e paginação. IP será obtido da conexão/proxies confiáveis e horário do servidor. Não há registro de polling, worker, tentativas de login ou identificação inequívoca de pessoas. Mecanismo frontend/backend, retenção e issue/sprint ainda não foram entregues; solicitação local registrada no documento de integração.
