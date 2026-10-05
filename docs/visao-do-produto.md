# Visão do Produto - GreenER

> Documento de visão do produto. Consolida **posicionamento**, **personas**, **objetivos mensuráveis** e **fronteira de escopo** da plataforma GreenER. Complementa o raciocínio técnico em `raciocinio-tecnico.md` e a especificação de contratos em `apis-auxiliares.md`.

---

## 1. Declaração de Posição do Produto

- **Para** gestores de TI, engenheiros de software e equipes de ESG/GreenOps
- **Que** precisam ter visibilidade sobre o impacto ambiental de suas aplicações distribuídas em nuvem
- **O GreenER** é uma plataforma web de monitoramento e análise ambiental de software
- **Que** converte métricas de infraestrutura (CPU, memória, disco e rede) em indicadores claros de consumo energético (kWh) e emissões de carbono (CO₂e)
- **Diferente de** ferramentas tradicionais de APM/observabilidade que focam apenas em desempenho e latência
- **Nosso produto** contextualiza o impacto computacional com a matriz energética regional e permite simulações e comparações para tomadas de decisão sustentáveis.

---

## 2. Princípios Norteadores

1. **Clareza antes da complexidade:** A interface não deve apenas exibir números, mas explicar o que eles significam para a tomada de decisão.
2. **Resiliência a ambientes dinâmicos:** A plataforma monitora um ambiente vivo; serviços entram, saem ou ficam indisponíveis sem quebrar a aplicação.
3. **Confiabilidade metodológica:** Aplicação rigorosa da fórmula oficial e padrões padronizados para garantir comparabilidade entre serviços e regiões.

---

## 3. Personas e Atores

| Persona                                | Papel                                                | O que busca                                                    | Como usa o GreenER                                                               |
| :------------------------------------- | :--------------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Gestor de TI / Produto**             | Responsável por custo e eficiência da infraestrutura | Visão executiva rápida do impacto ambiental do ecossistema     | Painel de KPIs (Nível 1) + exportação de relatório PDF para atas/reuniões        |
| **Engenheiro GreenOps / DevOps**       | Otimiza consumo de recursos e emissões               | Identificar qual serviço é o maior ofensor e onde otimizar     | Ranking e comparação entre serviços (Nível 2) + investigação detalhada (Nível 3) |
| **Analista de ESG / Sustentabilidade** | Reporta métricas ambientais corporativas             | Números confiáveis de emissão (gCO₂e) e participação renovável | Indicadores consolidados + exportação CSV para planilhas de reporte              |
| **Administrador da Plataforma**        | Configura e mantém o ambiente monitorado             | Gerenciar parâmetros e acessos da área de configuração         | Área autenticada (JWT), disponível a partir da Sprint 1                          |

---

## 4. Perguntas de Negócio que o Produto Responde

- Qual aplicação possui o maior impacto ambiental no ecossistema?
- Qual serviço apresenta a melhor eficiência energética relativa?
- Quanto CO₂e foi emitido por cada serviço em determinado período?
- Como a matriz energética geográfica de cada região influencia as emissões totais?
- Qual seria a redução de emissões caso uma aplicação fosse migrada para uma região com matriz mais limpa?

---

## 5. Jornada de Uso (Caso de Uso Principal)

> _Fluxo típico que valida o MVP de ponta a ponta._

1. O **gestor** abre o dashboard e vê, na **Visão Executiva (Nível 1)**, o consumo acumulado, as emissões totais e a data/hora da última atualização — sem recarregar a página.
2. Observa que **3 serviços** estão indisponíveis ou sem métricas (indicador de status) e que o total de emissões subiu.
3. Desce para a **Análise Comparativa (Nível 2)**, vê o **ranking de maiores emissores** e identifica o serviço X como o principal ofensor.
4. Clica no serviço X e abre a **Investigação Detalhada (Nível 3)**: histórico de CPU/RAM/Disco/Rede e variação de potência.
5. Usa a **simulação de migração de região** para estimar a redução de CO₂e caso o serviço fosse movido para uma região com matriz mais limpa.
6. **Exporta um Relatório Executivo (PDF)** com os KPIs e a tabela, ou um **CSV** para análise externa.

---

## 6. Hierarquia e Experiência da Interface (Dashboard)

A aplicação será dividida em três níveis de detalhamento:

- **Nível 1 - Visão Executiva (KPIs de Alto Nível):**
  - Consumo energético acumulado (kWh), Emissões totais (gCO₂e), Qtd. de serviços ativos, indisponíveis e sem métricas, além da indicação do horário da última atualização.
- **Nível 2 - Distribuição e Análise Comparativa:**
  - Visualização geográfica em mapa (bolhas por volume de emissão por região).
  - Ranking dos maiores causadores de impacto e matriz comparativa por região.
- **Nível 3 - Investigação Detalhada:**
  - Visão individual do serviço: histórico temporal de uso de recursos (CPU, RAM, Disco, Rede), variação de potência e gráficos de tendência.

---

## 7. Metas e Métricas de Sucesso (KPIs do Produto)

> _Critérios objetivos para validar que o produto cumpre sua proposta de valor. Ajustar metas ao final de cada sprint review._

| #   | Objetivo                                   | Métrica                                      | Meta sugerida              |
| :-- | :----------------------------------------- | :------------------------------------------- | :------------------------- |
| M1  | Descobrir serviços sem configuração manual | Serviços monitorados sem cadastro manual     | 100% via `/services`       |
| M2  | Identificar o maior ofensor rapidamente    | Tempo da abertura do dashboard até o ranking | < 10s                      |
| M3  | Atualização contínua de dados              | Atualização da interface sem reload          | ≤ ciclo de coleta          |
| M4  | Resiliência a falhas das APIs externas     | Coleta continua mesmo com 500/404            | 0 quedas de ciclo          |
| M5  | Relatório para tomada de decisão           | Geração de PDF/CSV executável pela UI        | 100% das visões principais |
| M6  | Reprodutibilidade do ambiente              | Subida completa via `docker compose up`      | Sem erro de conexão        |

---

## 8. Requisitos de Qualidade (Não-Funcionais) Consolidados

- **Atualização em tempo real:** Polling periódico no frontend, refletindo a última coleta sem recarregar a página.
- **Resiliência de ingestão:** Erros HTTP `500` e `404` das APIs externas não derrubam a API nem interrompem a coleta dos demais serviços.
- **Padrão de código:** TypeScript estrito, sem `any` injustificado.
- **Persistência:** PostgreSQL nativo, DDL/DML explícito, **sem ORM**.
- **Execução:** Containerizada via Docker (frontend, backend e banco), com volume persistente para o banco.
- **Metodologia:** Aplicação rigorosa da fórmula oficial de consumo/emissão, garantindo comparabilidade.

---

## 9. Fronteira do Escopo (Trava de MVP vs. Futuro)

### 9.1 MVP da Sprint 1 (entrega concreta)

- Descoberta e polling automático de serviços (reconciliação por conjunto de ids).
- Cálculo individual e consolidado de Energia (kWh) e CO₂e (g).
- Persistência em PostgreSQL sem ORM + histórico de coletas.
- Dashboard React + TypeScript com KPIs (Nível 1), tabela de serviços e atualização sem reload.
- Mecanismo global de exportação: CSV estruturado e PDF executivo.
- **Autenticação JWT da área de configuração (RP06):** login (bcrypt), emissão/validação de token e proteção de rotas, com usuário admin inicial via seed.
- Ambiente Docker completo (`compose.yaml` + volume persistente + provimento de segredos via `.env`).

### 9.2 Evoluções do Semestre (pós-MVP)

- Módulo de comparação e simulação de migração de região (Nível 2/3).
- Mapa geográfico e ranking de maiores emissores.
- Histórico temporal com consultas SQL analíticas e gráficos de tendência.
- Polimento da área administrativa autenticada (gestão de parâmetros e usuários).

### 9.3 Fora do Escopo (Não priorizar sem validação prévia)

- **Consumo de água:** Não há especificação oficial e metodologia validada no desafio atual.
- **Estimativas monetárias/financeiras:** O foco é puramente socioambiental (ESG).
- **Mapeamento geográfico de alta precisão/polígonos:** A API fornece apenas coordenadas aproximadas.

---

## 10. Itens em Aberto (a validar com o parceiro / no planning)

- **Regra do HTTP 404 em `/metrics/{id}`:** confirmar se indica serviço **removido** ou serviço **listado sem métricas (`metrics_missing`)** — impacto direto no indicador "sem métricas" do Nível 1.
- **Campo `status` em `/services`:** o schema define o enum `ServiceStatus`, mas ele não aparece no retorno real. Definir se o status é sempre inferido pelo cliente.
- **Carbon Intensity API:** contrato ainda não validado via `/openapi.json` — endpoints em `apis-auxiliares.md` são assumidos.
- **Área de configuração (JWT):** definir o que exatamente é configurável e como as credenciais iniciais são provisionadas no ambiente Docker.
