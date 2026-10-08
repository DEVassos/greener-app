# Pontos para Discutir em Grupo — GreenER

> Documento vivo com **dúvidas em aberto, decisões pendentes e assuntos que precisam de fechamento coletivo** (ou de resposta do parceiro UniLaunch). Atualizar conforme os itens forem resolvidos. Cada item tem um marcador de status.

**Status:** `🔴 aberto` · `🟡 em discussão` · `🟢 resolvido` · `⏳ aguardando terceiros`

---

## 1. Autenticação, Segredos e Ambiente (JWT + Docker)

### 1.1 🟢 Como o usuário inicial existe no ambiente

- **Decisão tomada:** **Opção (A)** — usuário admin pré-criado via seed SQL (`database/seed.sql`) com senha hasheada (bcrypt). Já refletido como tarefa **DB-03** e história **US07** da Sprint 1.
- **Contexto:** RP06 exige autenticação JWT na área de configuração. Em ambiente Docker, cada instalação sobe um banco **vazio**, então o usuário inicial precisa nascer junto com o schema.
- _Endpoints de registro (`/auth/register`) ficaram fora do MVP; a gestão de usuários é evolução pós-MVP._

### 1.2 🟡 Padrão de variáveis de ambiente

- **Contexto:** Segredos (como `JWT_SECRET`) **não vão para a imagem Docker nem para o Git**. O `.env.example` vai pro Git **com valores de desenvolvimento que funcionam**.
- **Perguntas:**
  - Qual o `JWT_SECRET` de exemplo? (ex: `dev-secret-change-me`)
  - Tempo de expiração do token (`JWT_EXPIRES_IN`)?
  - Vamos documentar todas as variáveis no `.env.example`?
- **Decisão a tomar:** fechar a lista de variáveis e os defaults.

### 1.3 🟢 Esclarecimento conceitual (já alinhado)

- `JWT_SECRET` é a **chave de assinatura**, **não** o login. Login funciona desde que o backend tenha **algum** segredo configurado.
- Cada instalação (online ou local) é **autossuficiente**: banco próprio, usuários próprios, segredo próprio; o `.env.example` só dá um "segredo de fábrica" padrão.
- **Consequência prática:** rodar a imagem local cria um GreenER **distinto** do online, com histórico de coletas separado (mesmo consumindo as mesmas APIs da UniLaunch).

---

## 2. Contrato das APIs Externas (a validar com o parceiro)

### 2.1 🔴 Regra do HTTP `404` em `/metrics/{id}`

- **Contexto:** ambíguo se significa serviço **removido** ou **listado sem métricas (`metrics_missing`)**. Afeta diretamente o indicador "sem métricas" do dashboard.
- **Perguntar ao parceiro:** um `404` pode ocorrer enquanto o serviço ainda aparece em `/services`?

### 2.2 🔴 Campo `status` em `/services`

- **Contexto:** o schema define o enum `ServiceStatus` (`available`, `unavailable`, `metrics_missing`), mas o campo **não aparece** no retorno real de `/services`.
- **Perguntar ao parceiro:** é intencional (status sempre inferido no cliente) ou falta implementar/documentar?

### 2.3 🔴 Carbon Intensity API não validada

- **Contexto:** só a Metrics API foi confirmada via `/openapi.json`. Os endpoints do Carbon em `especificacao-api.md` são **assumidos**.
- **Ação:** testar `https://carbon.unilaunch.org/openapi.json` e validar o schema.

### 2.4 🟡 Autenticação e rate limit das APIs

- **Perguntas:** as APIs exigem API key? Existe rate limit? O fator de carbono é estático (cacheável) ou varia em tempo real? `/services` muda entre equipes/sessões?

---

## 3. Modelagem de Dados

### 3.1 🟡 Nomes e estrutura das tabelas

- O backlog cita `servicos`, `coletas`, `usuarios`; o doc técnico (`abp-2026-2.md`) sugere `services` e `service_readings`.
- **Decisão a tomar:** padronizar nomenclatura (PT vs EN) e o número de tabelas.
- **Dúvida:** `service_readings` é **somente inserção** (histórico imutável) — confirmar essa regra.

### 3.2 🟡 Cálculo e armazenamento de Potência/Energia/CO₂e

- **Decisão a tomar:** potência e energia são **calculadas na hora** ou **persistidas** na coleta? Isso impacta reprocessamento e queries de análise (Sprint 2).

### 3.3 🟡 Uso de query builder (ex: Knex) vs. SQL puro

- RP03 diz "sem ORM". **Dúvida:** query builder é aceitável ou tem que ser SQL puro via driver `pg`? (consta nas perguntas do kickoff).

---

## 4. Escopo e Divisão do Trabalho

### 4.1 🟡 Divisão das 25 tarefas da Sprint 1 entre integrantes

- O backlog está fechado (**25 tarefas / 82 SP**, ver `sprints/sprint-1.md`), mas falta **atribuir responsáveis**.
- **Atualização:** a **autenticação JWT** foi antecipada para a Sprint 1 (tarefas `FE-06`, `BE-07`, `DB-03`, `DEVOPS-03`; história `US07`), alinhando a tabela `usuarios` ao seu uso real.
- **Ação:** vincular cada issue do GitHub a um membro.

### 4.2 🟡 Regra de nomenclatura de branch/commit

- Padrão definido pelo parceiro ou livre? (DoD sugere `feat(frontend): ... #FE-05`).
- **Decisão a tomar:** formalizar no repositório.

### 4.3 🟡 O que conta como "evidência documental" (RP05)

- **Perguntar ao parceiro:** qual formato/nível de detalhe é aceito como evidência.

### 4.4 🟡 Mapa geográfico (RF13): diferencial ou MVP?

- Confirmar se entra no MVP mínimo ou é evolução futura.

### 4.5 🟡 Histórico de coletas: só salvar ou já virar gráfico no MVP?

- Define se consultas SQL analíticas (Sprint 2) antecipam algo.

---

## 5. Cronograma e Comunicação

### 5.1 🟡 Datas oficiais das cerimônias

- Confirmar: sprint reviews (19/10, 09/11, 23/11) e data da **apresentação final**.

### 5.2 🟡 Como funciona a avaliação de cada sprint review

- Critérios e pesos por review.

### 5.3 🟡 Canal de comunicação com o parceiro

- Slack, WhatsApp, e-mail? E indisponibilidade das APIs fora do horário comercial deve ser reportada?

---

## 6. Repositório e Documentação

### 6.1 🟢 Organização de arquivos e pastas

- Docs consolidados na pasta `docs/` (kebab-case). Estrutura atual:
  ```
  docs/
  ├── abp-2026-2.md
  ├── especificacao-api.md
  ├── product-backlog.md
  ├── visao-do-produto.md
  ├── pontos-para-discutir.md
  └── sprints/
      └── sprint-1.md
  ```
- _Ainda pendente:_ criar `docs/plano-de-entregas.md` (matriz de rastreabilidade, exigido por RP05/ES).

### 6.2 🟡 Documentos previstos para o fim do semestre

- `docs/arquitetura.md`, `docs/calculos.md`, `docs/api.md` e `README.md` (citar em US14).
- `docs/plano-de-entregas.md` com a matriz de rastreabilidade.
