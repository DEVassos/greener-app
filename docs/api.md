# API — backend

Contrato do backend. A execução integrada usa os containers backend e PostgreSQL do `compose.yaml` (#26/#27): `docker compose up --build`.

## CORS

O dashboard roda em outra origem (`http://localhost:5173`) e chama a API pelo navegador. O backend envia `Access-Control-Allow-Origin` só para as origens de `CORS_ORIGIN` (padrão `http://localhost:5173`, lista separada por vírgula) e responde o preflight `OPTIONS` com `204`, liberando `Content-Type` e `Authorization`. Outra origem não recebe o cabeçalho, e o navegador bloqueia a resposta. Chamadas sem navegador (`curl`) não são afetadas.

## GET /api/services

Sem autenticação, parâmetros ou corpo. O prefixo `/api` corresponde ao padrão de `VITE_API_URL=http://localhost:3000/api` usado pelo frontend; `/health` permanece na raiz.

Devolve os serviços persistidos, o estado atual de monitoramento e a coleta mais recente de cada um. A consulta usa `LEFT JOIN LATERAL`, portanto um serviço sem coleta continua aparecendo com `lastReadingAt` e `cpuPercent` como `null`. Localização ausente no cadastro também permanece `null`. `energyKwh` e `emissionsG` são calculados a partir do intervalo da própria coleta e do fator regional; se o cálculo estiver indisponível, permanecem `null` sem invalidar as métricas.

Resposta 200:

```json
{
  "services": [{
    "id": "1",
    "name": "Demo",
    "country": "BR",
    "region": "Sul",
    "city": "Porto Alegre",
    "cpuPercent": 62.67,
    "energyKwh": 0.000480452625,
    "emissionsG": 0.040838473125,
    "status": "ativo",
    "lastReadingAt": "2026-10-14T20:00:00.000Z"
  }],
  "period": "última leitura (intervalo de coleta)"
}
```

Os números do exemplo são o exemplo OpenAPI de [`docs/calculos.md`](calculos.md): CPU 62,67%, RAM 3,17 GB, disco 19,26 GB, rede 0,45 GB, 27 s e fator 85 gCO₂e/kWh. `energyKwh` e `emissionsG` são da última coleta, que cobre um intervalo de cerca de 30 s, e não acumulados.

`status` do serviço: `ativo` (última métrica válida), `indisponivel` (falha do agregador ou métrica inválida), `sem_metricas` (404 do agregador para um serviço ainda listado) ou `removido` (saiu da lista do agregador; volta a `ativo` quando reaparece).

Falha de banco retorna 500 no envelope global, sem stack ou SQL:

```json
{"error":{"code":"DATABASE_ERROR","message":"Não foi possível verificar a conexão com o banco de dados."}}
```

## GET /api/services/summary

Indicadores agregados do dashboard, sem autenticação. Exige `from` e `to` em ISO 8601, com período `[from, to)` de até 31 dias.

```json
{"period":{"from":"2026-10-20T00:00:00.000Z","to":"2026-10-21T00:00:00.000Z"},"energyKwh":0.0124,"co2eGrams":1.05,"services":{"active":3,"unavailable":0,"withoutMetrics":0,"removed":0}}
```

Os totais consideram somente coletas com cálculo disponível. Datas inválidas, período vazio ou maior que 31 dias retornam 400 `VALIDATION_ERROR`.

## GET /api/collections

Histórico de coletas, sem autenticação nem corpo. Parâmetros opcionais:

- `service_id`: inteiro positivo;
- `from` e `to`: data **com hora** em ISO 8601, como `2026-10-18T00:00:00Z` ou `2026-10-18T00:00:00-03:00`. Só a data (`2026-10-18`) devolve 400, e `from` precisa ser anterior ou igual a `to`;
- `limit`: de 1 a 500, padrão 50.

A lista sai sempre da coleta mais recente para a mais antiga. `status` da coleta: `ok`, `erro` (falha do agregador ou métrica inválida, com `errorMessage`) ou `sem_metricas`.

Cada coleta traz o resultado do cálculo de energia e CO₂e ([fórmulas](calculos.md)), com `calculationStatus` em:

| `calculationStatus` | Significado | `energyKwh`, `co2eGrams`, `carbonIntensityGco2ePerKwh` |
|---|---|---|
| `disponivel` | as quatro métricas (CPU, memória, disco e rede) e a intensidade de carbono foram obtidas | número ≥ 0 (zero é resultado válido) |
| `nao_calculado` | a coleta foi gravada sem que o cálculo fosse executado. Coletas `erro` e `sem_metricas` ficam sempre assim, e não há recálculo depois | `null` |
| `indisponivel` | o cálculo foi tentado e não houve intensidade válida (região não informada; região sem fator na API de carbono, que respondeu 404; falha da API de carbono, por erro HTTP ou tempo esgotado; resposta fora do contrato) ou um valor saiu da faixa no cálculo. O motivo fica gravado em `collections.calculation_error_message` | `co2eGrams` e `carbonIntensityGco2ePerKwh`: sempre `null`. `energyKwh`: hoje `null`, porque o coletor não grava energia sem intensidade; o schema aceita energia gravada nesse estado e, nesse caso, a rota devolve o valor gravado |

`null` nessas três chaves significa **não calculado**, nunca zero: `energyKwh: 0` é uma coleta calculada que resultou em zero. As colunas são `numeric`, que o driver `pg` devolve como string; a conversão para número é feita na borda da API, então os valores saem em JSON numérico e não em string.

```json
{"collections":[{"id":"2","serviceId":"1","collectedAt":"2026-10-14T20:00:00.000Z","status":"ok","cpuPercent":42.5,"memoryGb":1.2,"diskGb":10,"networkGb":0.3,"errorMessage":null,"calculationStatus":"disponivel","energyKwh":0.000480452625,"co2eGrams":0.040838473125,"carbonIntensityGco2ePerKwh":85},{"id":"1","serviceId":"1","collectedAt":"2026-10-14T19:45:00.000Z","status":"ok","cpuPercent":40,"memoryGb":1.1,"diskGb":10,"networkGb":0.2,"errorMessage":null,"calculationStatus":"indisponivel","energyKwh":null,"co2eGrams":null,"carbonIntensityGco2ePerKwh":null}],"period":{"from":"2026-10-14T00:00:00.000Z","to":"2026-10-14T23:59:59.999Z"}}
```

O limite `to` é **inclusivo** (`collected_at <= to`): quem precisa de um período com fim aberto deve recuar 1 ms no parâmetro.

Parâmetro inválido devolve 400 `VALIDATION_ERROR`; `service_id` inexistente devolve 404 `NOT_FOUND`; falha de banco devolve 500 no envelope global, sem stack ou SQL.

## GET /api/services/compare

Compara de 2 a 10 serviços no mesmo período, sem autenticação.

`GET /api/services/compare?ids=1,2&from=2026-10-20T00:00:00Z&to=2026-10-21T00:00:00Z`

- `ids`: ids inteiros positivos, distintos e separados por vírgula;
- `from` e `to`: instantes ISO 8601 obrigatórios, com intervalo `[from, to)` de até 31 dias.

Resposta 200 ecoa `from` e `to` e traz, por serviço, contagens de coletas, falhas e coletas sem cálculo, médias de CPU/memória/disco/rede e somas de energia e CO₂e. Um serviço sem coleta permanece na resposta com `collections: 0` e métricas agregadas `null`; um id inexistente devolve 404. Entrada inválida devolve 400 `VALIDATION_ERROR`.

```json
{"from":"2026-10-20T00:00:00.000Z","to":"2026-10-21T00:00:00.000Z","services":[{"id":"1","name":"Demo","region":"Sul","collections":12,"failed":0,"notCalculated":0,"avgCpuPercent":42.5,"avgMemoryGb":2.1,"avgDiskGb":10,"avgNetworkGb":0.3,"energyKwh":0.01,"co2eGrams":0.85}]}
```

## GET /health

Sem autenticação, parâmetros ou corpo. Fica na raiz, sem o prefixo `/api` dos recursos. Consulta o PostgreSQL a cada chamada, sem cache.

Resposta 200, Content-Type application/json, somente após verificação real:

```json
{"status":"ok","db":"ok"}
```

Falha de conexão/consulta: 500 (DatabaseError conforme Agilekit), sem encerrar HTTP. Após recuperação do banco, nova consulta pode retornar 200.

```json
{"error":{"code":"DATABASE_ERROR","message":"Não foi possível verificar a conexão com o banco de dados."}}
```

Health comprova conectividade, não valida existência de tabelas, persistência, APIs externas ou coleta. No boot, indisponibilidade impede a abertura HTTP e encerra o processo com código não zero.

## Erros globais

| HTTP | Código | Situação |
|---|---|---|
| 400 | VALIDATION_ERROR | JSON inválido com Content-Type application/json; parâmetro inválido em `GET /api/collections` |
| 404 | NOT_FOUND | rota não registrada, incluindo métodos não registrados; `service_id` inexistente em `GET /api/collections` |
| 500 | DATABASE_ERROR | falha de conexão ou de consulta no PostgreSQL |
| 500 | INTERNAL_ERROR | erro inesperado, sem detalhes internos |

Envelope único, sem stack, credenciais ou consulta SQL:

```json
{"error":{"code":"VALIDATION_ERROR","message":"JSON inválido no corpo da requisição."}}
```

Roteiro de verificação, configuração e scripts: [backend/README.md](../backend/README.md). Os arquivos `usuarios.*.ts` são reserva da autenticação e não expõem rota. Ainda não há endpoints de autenticação (`POST /auth/login`), de configuração (`/monitoring-settings`) nem de auditoria de entradas: eles estão previstos para a Sprint 2 ([#20](https://github.com/DEVassos/greener-app/issues/20)).
