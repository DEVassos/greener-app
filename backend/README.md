# Backend EcoPulse — setup da API (#8)

Node 20, Express 5, TypeScript estrito e PostgreSQL pelo driver pg. Esta entrega local implementa somente inicialização e saúde da API; depende de revisão e publicação. Não há CRUD, ingestão, worker, cálculos, JWT ou auditoria.

## Organização

Baseada no modelo do professor: `src/app.ts` monta Express; `src/server.ts` inicia HTTP; `src/db/connection.ts` gerencia pool único; módulos usam `routes/controller/service/repository`. Os quatro `src/modules/usuarios/usuarios.*.ts` de Lucas permanecem inalterados e sem rotas registradas. `config/env.ts`, `shared/errors.ts` e `middlewares/error-handler.ts` aplicam os padrões do Agilekit. SQL fica somente nos repositories.

O tsconfig mantém ES2022, Node16 para módulo/resolução, strict, rootDir src e outDir dist. Sem type=module, o build emite CommonJS. Testes ficam fora de src.

## Ambiente e execução

| Variável | Padrão | Regra |
|---|---|---|
| PORT | 3000 | inteiro de 1 a 65535 |
| DATABASE_URL | sem padrão | URL postgres/postgresql com host e nome do banco; obrigatória |

Somente `config/env.ts` lê process.env. Não há leitura automática de `.env`: o ambiente deve ser fornecido ao processo. A #7/#82 mantém o modelo na raiz e a #27 fará a injeção no Compose. JWT e polling não são exigidos pelo setup. Não registre URLs com credenciais em logs.

Caminho oficial: `docker compose up --build`, pelo WSL nesta máquina. Dockerfile backend (#26) e serviços backend/PostgreSQL (#27) ainda são dependências; esta branch não cria infraestrutura concorrente à #81. O host dentro da DATABASE_URL precisa ser o serviço PostgreSQL do Compose, não localhost.

Comandos do módulo, com Node 20 e ambiente já fornecido (atalhos de desenvolvimento/validação, não substituem Compose):

```bash
cd backend
npm ci
npm run typecheck
npm test
npm run build
npm start
# Alternativa para desenvolvimento com recarga:
npm run dev
```

Node 20 segue a regra atual do Agilekit. O CI compartilhado usa Node 22 e o modelo do professor usa Node 24. O alinhamento deve ser encaminhado à equipe/SM: esta entrega não modifica regra, workflow ou Dockerfile. Testar em Node 22/24 não substitui validar Node 20; Node 20 está fora do suporte oficial.

## Boot, saúde e falhas

Antes de abrir HTTP, o backend valida ambiente e consulta PostgreSQL. Falha encerra com código não zero e fecha o pool. Cada GET /health executa nova consulta, sem cache de sucesso. Falha em runtime retorna DATABASE_ERROR/500 e mantém HTTP ativo; a chamada seguinte pode recuperar. Timeouts: conexão e statement 3 s; query 4 s. Health verifica conectividade, não valida schema nem ingestão.

JSON inválido retorna 400; rota inexistente 404; erro inesperado 500. Envelope e exemplos em [API](../docs/api.md). SIGINT/SIGTERM fecham HTTP e pool; há limite de 10 s para encerramento do processo.

## Como verificar

Após disponibilizar #26/#27, em ambiente descartável e com banco próprio:

1. Subir com `docker compose up --build`: backend só abre a porta após consulta real ao banco.
2. `curl -i http://localhost:3000/health`: 200 e `{"status":"ok","db":"ok"}`.
3. `curl -i -X POST -H 'Content-Type: application/json' --data '{' http://localhost:3000/health`: 400 e VALIDATION_ERROR.
4. `curl -i http://localhost:3000/inexistente`: 404 e NOT_FOUND.
5. Parar somente o banco descartável: health retorna 500/DATABASE_ERROR dentro do timeout; backend permanece ativo. Reiniciar o banco: health volta a 200.
6. Iniciar outro backend com endereço inacessível: código não zero, sem porta HTTP aberta. Ambiente inválido também impede boot.
7. Encerrar backend por SIGTERM: HTTP e pool fechados. Não executar down -v sobre volumes existentes.

`npm test` cobre configuração, espera da verificação, falha/recuperação HTTP, parsing, erros e boot/encerramento com banco falso. É necessário complementar com PostgreSQL real descartável e registrar resultados; testes falsos não comprovam conexão real. Erro inesperado e parsing válido usam aplicações exclusivas dos testes, sem endpoints demonstrativos publicados.
