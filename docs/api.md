# API — backend

Contrato do backend. A execução integrada usa os containers backend e PostgreSQL do `compose.yaml` (#26/#27): `docker compose up --build`.

## GET /api/services

Sem autenticação, parâmetros ou corpo. O prefixo `/api` corresponde ao padrão de `VITE_API_URL=http://localhost:3000/api` usado pelo frontend; `/health` permanece na raiz.

Devolve os serviços persistidos, o estado atual de monitoramento e a coleta mais recente de cada um. A consulta usa `LEFT JOIN LATERAL`, portanto um serviço sem coleta continua aparecendo com `lastReadingAt` e `cpuPercent` como `null`. Localização ausente no cadastro também permanece `null`. Nesta Sprint 1, `energyKwh` e `emissionsG` são sempre `null`: cálculo socioambiental é escopo da Sprint 2.

Resposta 200:

```json
{
  "services": [{
    "id": "1",
    "name": "Demo",
    "country": "BR",
    "region": "Sul",
    "city": "Porto Alegre",
    "cpuPercent": 51.25,
    "energyKwh": null,
    "emissionsG": null,
    "status": "ativo",
    "lastReadingAt": "2026-10-14T20:00:00.000Z"
  }],
  "period": "última leitura disponível"
}
```

Falha de banco retorna 500 no envelope global, sem stack ou SQL:

```json
{"error":{"code":"DATABASE_ERROR","message":"Não foi possível verificar a conexão com o banco de dados."}}
```

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
