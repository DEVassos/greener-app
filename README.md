# 🌱 EcoPulse — Estimativa do Impacto Ambiental de Aplicações de Software

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Projeto de Aprendizagem Baseada em Projetos (ABP) — 2º semestre de Desenvolvimento de Software Multiplataforma**
**FATEC Jacareí · 2026-2 · Parceiro: UniLaunch · Focal point: Prof. Rodrigo Silva Peres · Equipe: DEVassos**

</div>

**EcoPulse** é o nome do produto. No edital do desafio ele aparece como **GreenER**; o repositório continua `DEVassos/greener-app`.

---

## 1. Problema

Empresas operam dezenas ou centenas de aplicações distribuídas em várias regiões. Métricas de CPU, memória, armazenamento e rede são usadas para desempenho e disponibilidade, mas quase nunca para entender o **impacto ambiental** dessas aplicações. Gestores têm pouca visibilidade sobre o consumo energético dos sistemas e as emissões de carbono associadas.

## 2. Solução

O **EcoPulse** é uma plataforma web de observabilidade socioambiental (**GreenOps**) que monitora continuamente aplicações e microsserviços a partir de duas APIs do parceiro — o [Agregador de Métricas](https://metrics.unilaunch.org/docs) e o [Serviço de Intensidade de Carbono](https://carbon.unilaunch.org/docs). Ela traduz métricas de infraestrutura (**CPU, memória, disco e rede**) em **consumo energético (kWh)** e **pegada de carbono estimada (gCO₂e)**, ponderada pela intensidade de carbono da matriz elétrica da região onde cada serviço está hospedado. O ambiente monitorado é dinâmico: serviços surgem, ficam indisponíveis, deixam de exportar métricas e voltam, e a plataforma se adapta sem intervenção manual.

> 💡 **Princípio central:** software não consome energia diretamente, mas o hardware que o executa sim. O EcoPulse é uma ponte analítica entre a infraestrutura de TI e as metas corporativas de sustentabilidade e ESG.

Requisitos completos (RF01–RF15, RNF01–RNF05, RP01–RP07): [docs/requisitos.md](docs/requisitos.md).

Setup do backend: [organização e validação](backend/README.md) e [contrato de saúde](docs/api.md). Frontend, backend e PostgreSQL sobem juntos pelo `compose.yaml` (#26, #27).

## 3. Funcionalidades implementadas

O desenvolvimento acontece na branch `develop`; cada funcionalidade entra nesta lista quando o Pull Request correspondente é mergeado, com o requisito e o número do PR. O que está previsto para a Sprint 1 (review em 19/10/2026) está em [docs/sprints/sprint-1.md](docs/sprints/sprint-1.md).

- **RF09, RF12 — Tabela operacional de serviços (#69):** dashboard com cada serviço monitorado, CPU, energia, emissão, última leitura, localização (região, cidade e país) e status (ativo, indisponível, sem métricas), com busca por nome e ordenação por coluna. A tela consome `GET /api/services` (#115) pela base definida em `VITE_API_URL`; sem ela (variável vazia), o frontend sobe em modo demonstração com dados ilustrativos (`npm run mock`) — como executar em [frontend/README.md](frontend/README.md).

  ![Tabela de serviços monitorados](docs/img/sprint-1-servicos.png)

- **RNF02 — Indicador de última atualização (#89):** selo no cabeçalho com o horário da última busca bem-sucedida e um ponto verde pulsando enquanto os dados estão em dia; se uma busca falha, ele fica laranja e passa a dizer "Desatualizado desde …", sem apagar os dados da tela.

  ![Selo de última atualização no cabeçalho](docs/img/sprint-1-ultima-atualizacao.png)

- **RF11, RNF02 — Atualização automática sem recarregar (#100, #114):** o dashboard busca os dados de novo a cada intervalo (`VITE_REFRESH_INTERVAL_MS`, padrão 30 s), pausa com a aba oculta e tem o botão **Atualizar agora**; se uma atualização falha, os dados anteriores continuam na tela e aparece o erro com **Tentar novamente**.

  ![Dashboard depois de uma atualização com falha](docs/img/sprint-1-atualizacao-automatica.png)

- **RF01, RF02, RF03, RF04 — Descoberta e coleta periódica (#95, #98, #99):** o backend descobre os serviços no agregador de métricas, consulta `/metrics/{id}` e grava o histórico no PostgreSQL; o _worker_ roda em segundo plano e reconcilia serviços que aparecem, ficam indisponíveis ou voltam a exportar métricas.

- **RF10 — API dos serviços e histórico de coletas (#115, #116, #119):** `GET /api/services` devolve os serviços monitorados com a última leitura, e `GET /api/collections?service_id=&from=&to=&limit=` devolve o histórico paginado de coletas, com CORS liberado para o dashboard. Contrato completo em [docs/api.md](docs/api.md).

- **RNF05, DW07 — Execução com Docker (#91, #113, #81):** backend, frontend (nginx) e PostgreSQL sobem juntos por `docker compose up --build`, com volume persistente para o banco e todas as variáveis documentadas em [.env.example](.env.example) (#82). Passo a passo no [README](#8-como-executar).

## 4. Escopo planejado

> Planejado, **ainda não implementado**. O andamento real está no [quadro do projeto](https://github.com/orgs/DEVassos/projects/6) e no [plano de entregas](docs/plano-de-entregas.md).

- **Motor de cálculo socioambiental:** potência (W), energia (kWh) e emissões (gCO₂e) pela fórmula oficial do desafio, com o fator regional da API de intensidade de carbono.
- **Dashboard em três níveis:** visão executiva (kWh total, gCO₂e, serviços ativos e indisponíveis, com atualização sem recarregar), análise comparativa (ranking e distribuição geográfica) e investigação detalhada (histórico por serviço).
- **Área de configuração autenticada:** JWT no backend e senhas com bcrypt.
- **Diferenciais em estudo:** simulação de migração para regiões com matriz mais limpa e exportação de relatórios em PDF/CSV ([proposta](docs/produto/diferenciais-devassos.pdf)).

## 5. Tecnologias

| Camada | Tecnologia (obrigatória pelo desafio, RP01–RP06) |
|---|---|
| Frontend | React + TypeScript (Vite, Tailwind CSS) |
| Backend | Node.js + TypeScript, API REST em módulos (routes, controllers, services, repositories) |
| Banco de dados | PostgreSQL com DDL e DML explícitos via driver `pg`, sem ORM |
| Segurança | JWT no backend e bcrypt para senhas |
| Execução | Docker Compose (frontend, backend e PostgreSQL com volume persistente) |

## 6. Equipe (DEVassos)

| | Integrante | Papel | GitHub |
| :---: | :--- | :--- | :---: |
| <img src="https://github.com/henriqueptbd-cell.png" width="60" alt="Henrique Camargo" /> | **Henrique Camargo** | Product Owner | [@henriqueptbd-cell](https://github.com/henriqueptbd-cell) |
| <img src="https://github.com/travensolli.png" width="60" alt="Gabriel Travensolli" /> | **Gabriel Travensolli** | Scrum Master | [@travensolli](https://github.com/travensolli) |
| <img src="https://github.com/DeaTuribio.png" width="60" alt="Andrea Turibio" /> | **Andrea Turibio** | Desenvolvedora (frontend) | [@DeaTuribio](https://github.com/DeaTuribio) |
| <img src="https://github.com/LUCASAMR23.png" width="60" alt="Lucas Amorim" /> | **Lucas Amorim** | Desenvolvedor (backend) | [@LUCASAMR23](https://github.com/LUCASAMR23) |
| <img src="https://github.com/viniciusaugusto1997.png" width="60" alt="Vinicius Augusto" /> | **Vinicius Augusto** | Desenvolvedor (backend e banco de dados) | [@viniciusaugusto1997](https://github.com/viniciusaugusto1997) |

## 7. Sprints

| Sprint | Período | Review (a confirmar) | Objetivo |
|---|---|---|---|
| 1 | 29/09 → 19/10/2026 | 19/10 às 19h30 | Pipeline de coleta persistido em Docker e primeira tela do dashboard (serviços com estado e localização, atualizando sem recarregar) |
| 2 | 20/10 → 09/11/2026 | 09/11 às 19h30 | Dashboard completo com energia, CO₂e, tolerância a falhas e área de configuração protegida por JWT |
| 3 | 10/11 → 23/11/2026 | 23/11 às 19h30 | Ranking de impacto, comparação entre serviços, mapa e repositório pronto como portfólio |

Critérios previstos, responsáveis e evidências de cada sprint: [docs/plano-de-entregas.md](docs/plano-de-entregas.md).

## 8. Como executar

Pré-requisitos: [Docker](https://www.docker.com/get-started) com Docker Compose e [Git](https://git-scm.com/).

```bash
git clone https://github.com/DEVassos/greener-app.git
cd greener-app
cp .env.example .env
docker compose up --build
```

| Serviço | URL | Situação |
|---|---|---|
| Frontend (dashboard) | http://localhost:5173 | no `compose.yaml` |
| Backend (API e `/health`) | http://localhost:3000/health | no `compose.yaml`; sobe depois que o PostgreSQL fica saudável |
| PostgreSQL 16 | `localhost:5433` (`POSTGRES_HOST_PORT`) | no `compose.yaml`, volume `pgdata`; acesso com `docker compose exec postgres psql -U ecopulse -d ecopulse_db` |

Na primeira subida o PostgreSQL aplica [`database/schema.sql`](database/schema.sql) sozinho; detalhes em [database/README.md](database/README.md). Com `VITE_API_URL` apontando para `http://localhost:3000/api` (como no `.env.example`), o dashboard mostra os serviços que o backend coletou: a lista começa vazia e é preenchida pelo coletor que o backend inicia junto com a API (descoberta no agregador a cada `POLLING_INTERVAL_MS`, padrão 30 s); sem acesso ao agregador, a lista para de mudar e mostra o que já está no banco; o aviso "Desatualizado desde …" aparece quando o próprio backend não responde. Deixando `VITE_API_URL` vazia, o frontend sobe em modo demonstração com dados ilustrativos e faixa de aviso; `npm run mock` sobe um backend falso para desenvolvimento. Detalhes da imagem do frontend em [frontend/README.md](frontend/README.md#execução-em-container).

`docker compose down` para os containers e mantém os dados; `docker compose down -v` também apaga o volume `pgdata` (banco zerado na próxima subida).

### Modelo de configuração (variáveis de ambiente)

Os valores de configuração vivem em um `.env` na raiz do repositório, que **não** é versionado ([`.gitignore`](.gitignore)). O que vai para o Git é o **modelo** em [`.env.example`](.env.example), com valores de **exemplo** para desenvolvimento: na raiz do repositório, `cp .env.example .env`.

São exemplos, não um preset universal: `DATABASE_URL` depende do banco, das credenciais e do host de cada ambiente — dentro de um container, `localhost` aponta para o próprio container, não para a máquina nem para o serviço do PostgreSQL. Revise os valores em cada instalação.

O `compose.yaml` lê o `.env` e repassa as variáveis aos containers ([#27](https://github.com/DEVassos/greener-app/issues/27)). Dentro do compose, a `DATABASE_URL` do backend é montada a partir de `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` com o host `postgres`; a `DATABASE_URL` do `.env` só vale para rodar o backend fora do Docker. Sem `.env`, o compose usa os mesmos valores de exemplo.

| Variável | Exemplo em `.env.example` | Para que serve |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `ecopulse` / `ecopulse` / `ecopulse_db` | usuário, senha e banco criados no PostgreSQL do compose na primeira subida do volume |
| `POSTGRES_HOST_PORT` | `5433` | porta do host em que o banco do compose fica acessível; dentro do Docker é sempre `postgres:5432`. 5433 evita conflito com um PostgreSQL local; troque se ela estiver em uso |
| `PORT` | `3000` | porta HTTP em que a API do backend atende |
| `DATABASE_URL` | `postgresql://ecopulse:ecopulse@localhost:5433/ecopulse_db` | conexão do PostgreSQL usada pelo driver `pg` fora do Docker (no compose ela é montada com `POSTGRES_*`) |
| `CARBON_API_URL` | `https://carbon.unilaunch.org` | base da API de intensidade de carbono do parceiro |
| `JWT_SECRET` | `dev-secret-change-me` | chave que assina os tokens JWT da área de configuração |
| `JWT_EXPIRES_IN` | `8h` | validade do token emitido no login |
| `METRICS_API_URL` | `https://metrics.unilaunch.org` | base da API agregadora de métricas do parceiro |
| `POLLING_INTERVAL_MS` | `30000` | intervalo da descoberta de serviços e prazo inicial/de recuperação da coleta (30 s); o prazo normal vem de `collection_interval_seconds` |
| `CORS_ORIGIN` | `http://localhost:5173` | origem(ns) do dashboard liberadas pelo backend para chamar a API pelo navegador (CORS), separadas por vírgula |
| `VITE_API_URL` | `http://localhost:3000/api` | base da API consumida pelo dashboard |

Nenhum segredo real entra no repositório (RP06): cada instalação tem banco, usuários e segredo próprios, então troque esses valores no `.env` antes de publicar.

## 9. Como trabalhamos

- **Git Flow:** `main` recebe uma release por sprint (tag `sprint-N`); `develop` integra o trabalho; cada issue vira uma branch `tipo/<nº>-slug` e um Pull Request revisado por outra pessoa do time.
- **Backlog em três níveis:** épico (tema de requisitos) → história de usuário (com critérios de aceite) → tarefa técnica, ligados por sub-issues no [quadro](https://github.com/orgs/DEVassos/projects/6).
- Processo Scrum, papéis, cerimônias e Definition of Done: [docs/processo/README.md](docs/processo/README.md).
- Padrões de branch, commit e PR: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).

## 10. Documentação

| Documento | Conteúdo |
|---|---|
| [docs/visao-do-produto.md](docs/visao-do-produto.md) | Posicionamento, personas, jornada, metas e fronteira do MVP |
| [docs/requisitos.md](docs/requisitos.md) | Requisitos funcionais, não funcionais e restrições do desafio |
| [docs/especificacao-api.md](docs/especificacao-api.md) | Contrato das APIs auxiliares do parceiro (Métricas e Intensidade de Carbono) |
| [docs/abp-2026-2.md](docs/abp-2026-2.md) | Raciocínio técnico: reconciliação dinâmica de serviços, estrutura de dados, perguntas ao parceiro |
| [docs/arquitetura/modelagem-uml.md](docs/arquitetura/modelagem-uml.md) | Modelagem UML (casos de uso, classes, sequências) |
| [docs/backlog/historias-de-usuario.md](docs/backlog/historias-de-usuario.md) | Histórias de usuário US01–US14 com critérios de aceite |
| [docs/plano-de-entregas.md](docs/plano-de-entregas.md) | Plano das sprints, critérios da rubrica, responsáveis e evidências |
| [docs/sprints/](docs/sprints/) | Registro de cada sprint: planejamento ([Sprint 1](docs/sprints/sprint-1/planning.md)), dailies, review, retrospectiva, participação |
| [docs/pontos-para-discutir.md](docs/pontos-para-discutir.md) | Decisões em aberto e dúvidas para o parceiro |
| [docs/produto/](docs/produto/) | Proposta de diferenciais, protótipo HTML do dashboard e [protótipo navegável no Figma](docs/produto/prototipo-figma.md) (dashboard, login e cadastro, desktop e celular) |
| [docs/adr/](docs/adr/) | Decisões de arquitetura (ADRs) |
| [docs/processo/](docs/processo/) | Como o time trabalha |
| [docs/contexto/](docs/contexto/) | Documentos do desafio (edital, documentação estendida, apresentação do kickoff, rubrica) |

Documentação técnica de execução (`docs/arquitetura.md`, `docs/api.md`, `docs/calculos.md`, READMEs de `frontend/`, `backend/` e `database/`) é criada junto com o código correspondente.

## 11. Status

**Sprint 1** (29/09 → 19/10/2026): em fechamento — congelamento em 18/10/2026 às 20h e review em 19/10/2026 às 19h30. `develop` reúne 40 Pull Requests mergeados entre 06/10 e 15/10, cobrindo os itens do [plano de entregas](docs/plano-de-entregas.md) previstos para a sprint (18 itens, 79 pontos): 13 concluídos; ES05 (distribuição), ES06 (review) e ES09 (participação) fecham com a review de 19/10 e o fechamento; ES07 está **parcial** (#60 e #110 mergeados sem revisão, #82 com mudanças pedidas) e ES08 também — os READMEs de [`backend/`](backend/README.md) e [`database/`](database/README.md) e o [`docs/api.md`](docs/api.md) ainda tratam entregas já mergeadas como "em revisão". Situação por critério, verificações realizadas e pendências em [docs/sprints/sprint-1.md](docs/sprints/sprint-1.md).

---

<div align="center">
Desenvolvido com 💚 pela equipe <strong>DEVassos</strong> · FATEC Jacareí 2026 · Licença <a href="LICENSE">MIT</a>
</div>
