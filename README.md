# GreenER — Estimativa do Impacto Ambiental de Aplicações de Software

> Projeto ABP · 2º semestre de Desenvolvimento de Software Multiplataforma · FATEC Jacareí · 2026-2
> Parceiro: **UniLaunch** · Focal point: Prof. Rodrigo Silva Peres · Kick-off: 28/09/2026

## Problema

Empresas operam dezenas ou centenas de aplicações distribuídas em várias regiões. Métricas de CPU, memória, armazenamento e rede são usadas para desempenho e disponibilidade, mas quase nunca para entender o **impacto ambiental** dessas aplicações. Gestores têm pouca visibilidade sobre o consumo energético dos sistemas e as emissões de carbono associadas.

## Solução

O **GreenER** é uma plataforma web que monitora continuamente aplicações de software a partir de duas APIs auxiliares fornecidas pelo parceiro — o [Agregador de Métricas](https://metrics.unilaunch.org/docs) e o [Serviço de Intensidade de Carbono](https://carbon.unilaunch.org/docs) —, estima o consumo energético de cada serviço e calcula sua emissão aproximada de CO₂ equivalente (CO₂e). O ambiente monitorado é dinâmico: serviços surgem, ficam indisponíveis, deixam de exportar métricas e voltam; a plataforma se adapta sem intervenção manual e apresenta indicadores por serviço, consolidados, rankings e comparações.

Os requisitos completos (RF01–RF15, RNF01–RNF05, RP01–RP07) estão em [docs/requisitos.md](docs/requisitos.md).

## Funcionalidades implementadas

Nenhuma ainda. O desenvolvimento acontece na branch `develop`; cada funcionalidade entra nesta lista quando o Pull Request correspondente é mergeado, com o requisito e o número do PR (ex.: "RF01 — Descoberta de serviços (#12)"). A primeira versão executável está prevista para a Sprint 1 (review em 19/10/2026).

## Tecnologias

| Camada | Tecnologia (obrigatória pelo desafio) |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Node.js + TypeScript, API REST organizada em módulos (routes, controllers, services, repositories) |
| Banco de dados | PostgreSQL com DDL e DML explícitos (driver `pg`, sem ORM) |
| Execução | Docker Compose (frontend, backend e PostgreSQL com volume persistente) |
| Autenticação | JWT no backend para a área de configuração |

## Equipe

| Integrante | Papel | GitHub |
|---|---|---|
| Henrique Camargo | Product Owner | [@henriqueptbd-cell](https://github.com/henriqueptbd-cell) |
| Gabriel Travensolli | Scrum Master | [@travensolli](https://github.com/travensolli) |
| Andrea Turibio | Desenvolvedora (frontend) | [@DeaTuribio](https://github.com/DeaTuribio) |
| Lucas Amorim | Desenvolvedor (backend) | [@LUCASAMR23](https://github.com/LUCASAMR23) |
| Vinicius Augusto | Desenvolvedor (banco de dados) | [@viniciusaugusto1997](https://github.com/viniciusaugusto1997) |

## Como executar

A aplicação ainda não é executável: o `compose.yaml`, os Dockerfiles e o `.env.example` fazem parte das primeiras entregas da Sprint 1. Quando existirem, esta seção trará os comandos (`cp .env.example .env` e `docker compose up --build`) e as URLs de acesso.

## Como trabalhamos

- Git Flow: `main` recebe uma release por sprint (tag `sprint-N`); `develop` integra o trabalho; cada issue vira uma branch `tipo/<nº>-slug` e um Pull Request revisado por outra pessoa do time.
- Processo Scrum, papéis, cerimônias e Definition of Done: [docs/processo/README.md](docs/processo/README.md).
- Padrões de branch, commit e PR: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).
- Planejamento das três sprints e critérios de avaliação: [docs/plano-de-entregas.md](docs/plano-de-entregas.md).
- Quadro: GitHub Projects da organização DEVassos (link em [docs/processo/quadro.md](docs/processo/quadro.md)).

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/requisitos.md](docs/requisitos.md) | Requisitos funcionais, não funcionais e restrições do desafio |
| [docs/plano-de-entregas.md](docs/plano-de-entregas.md) | Plano das sprints, critérios da rubrica, responsáveis e evidências |
| [docs/sprints/](docs/sprints/) | Registro de cada sprint: planejamento, dailies, review, retrospectiva, participação |
| [docs/adr/](docs/adr/) | Decisões de arquitetura (ADRs) |
| [docs/processo/](docs/processo/) | Como o time trabalha |

Documentação técnica (`docs/arquitetura.md`, `docs/api.md`, `docs/calculos.md`, READMEs de `frontend/`, `backend/` e `database/`) é criada junto com o código correspondente.

## Status

**Sprint 1** (29/09 → 19/10/2026): em andamento. Objetivo: pipeline de coleta persistido em Docker e primeira tela do dashboard com os serviços descobertos, seu estado e localização.
