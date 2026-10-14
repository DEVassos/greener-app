# API — setup do backend (#8)

Contrato da implementação local em revisão. A execução integrada depende dos containers backend/PostgreSQL (#26/#27); não há endpoints de negócio nesta entrega.

## GET /api/collections

Histórico de coletas, sem autenticação ou corpo. Parâmetros opcionais: `service_id` (inteiro positivo), `from` e `to` (ISO 8601) e `limit` (1 a 500; padrão 50). A lista é sempre ordenada da coleta mais recente para a mais antiga.

```json
{"collections":[{"id":"1","serviceId":"1","collectedAt":"2026-10-14T20:00:00.000Z","status":"ok","cpuPercent":42.5,"memoryGb":1.2,"diskGb":10,"networkGb":0.3,"errorMessage":null}],"period":{"from":null,"to":null}}
```

Parâmetro inválido devolve 400 `VALIDATION_ERROR`; `service_id` inexistente devolve 404 `NOT_FOUND`; falha de banco devolve 500 no envelope global, sem stack ou SQL.

## GET /health

Sem autenticação, parâmetros ou corpo. Permanece na raiz, sem prefixo /api. Consulta PostgreSQL a cada chamada, sem cache. Prefixo dos recursos e CORS pertencem à integração futura.

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
| 400 | VALIDATION_ERROR | JSON inválido com Content-Type application/json |
| 404 | NOT_FOUND | rota não registrada, incluindo métodos não registrados |
| 500 | DATABASE_ERROR | falha na verificação do PostgreSQL |
| 500 | INTERNAL_ERROR | erro inesperado, sem detalhes internos |

Envelope único, sem stack, credenciais ou consulta SQL:

```json
{"error":{"code":"VALIDATION_ERROR","message":"JSON inválido no corpo da requisição."}}
```

Roteiro de verificação, configuração e scripts: [backend/README.md](../backend/README.md). Os arquivos usuarios.*.ts estão preservados, mas não expõem CRUD. Nenhum endpoint de autenticação, serviço, coleta ou auditoria é anunciado por este contrato.
