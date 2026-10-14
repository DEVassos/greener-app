# API — setup do backend (#8)

Contrato da implementação local em revisão. A execução integrada depende dos containers backend/PostgreSQL (#26/#27); não há endpoints de negócio nesta entrega.

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
