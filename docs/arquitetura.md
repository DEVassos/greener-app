# Arquitetura — modelo de dados integrado

UML e DDL foram integrados pelo PR #77. Base SQL de Lucas (#5/#44), modelagem #28; o contexto está no [registro de integração](arquitetura/integracao-modelagem-banco.md). O nome EcoPulse foi aplicado à documentação e às configurações na #68.

O setup local da #8, em revisão, acrescenta Express/TypeScript e pool pg: ambiente validado → consulta real ao banco → abertura HTTP. Cada GET /health percorre routes/controller/service/repository e consulta novamente o banco; falhas usam middleware global. Não entrega worker, JWT, cálculos ou auditoria. Organização e limites em [backend/README.md](../backend/README.md) e contrato em [api.md](api.md). No `compose.yaml` (#26, #27) o backend só sobe depois do healthcheck do PostgreSQL e se conecta a ele pelo host `postgres` da rede interna.

## Responsabilidades e fluxo projetado

Implementação em revisão da #19: `jobs/collector.ts` coordena HTTP externo, descoberta válida e repositories existentes. Reconciliação é atômica; coleta e estado usam transação por serviço, mantendo HTTP fora do banco. O dispatcher não sobrepõe ciclos; shutdown cancela transporte e aguarda transações antes do pool. Depende do contrato bruto/cancelamento #97/#98 e da #27 para Compose integrado. Carbono/cálculo não fazem parte deste worker; persistência continua com `nao_calculado`. Essa proposta publicada não é evidência de código já integrado.

Contribuição local da #14: repositories de services/collections e UserRepository no módulo usuarios existente recebem executor tipado do pg. `withTransaction` reserva a mesma conexão e faz commit/rollback; a #19 coordenará as operações somente após descoberta válida, mantendo a decisão de reconciliação e o mapeamento de falhas fora da persistência. IDs bigint e numeric permanecem strings. A entrega não altera UML/schema, não registra rotas e não inicia coleta; contratos e testes no [README backend](../backend/README.md#repositories--contribuição-local-da-14).

Metrics API → worker futuro → validação de métricas → repositories pg → PostgreSQL → API REST futura → dashboard. Carbon API alimenta cálculo na Sprint 2. React/TS e Node/TS são obrigatórios, mas não implementados por esta tarefa. SQL de dados ficará exclusivamente nos repositories com parâmetros; sem ORM/query builder.

Cliente de carbono (#17): `backend/src/integrations/carbon-api.ts` consulta o fator regional e mantém cache em memória, com configuração centralizada e tipos próprios. HTTP/relógio são injetáveis para testes; erros usam a hierarquia compartilhada `AppError`. O cliente ainda não participa do fluxo de coleta/cálculo/persistência. Política decidida pelo PO na [#17](https://github.com/DEVassos/greener-app/issues/17#issuecomment-6157652891) e roteiro de verificação em [README backend](../backend/README.md#cliente-de-carbono-17); UML e schema permanecem inalterados.

Dashboard público; configuração e consulta de entradas exigirão JWT no backend com users administrativos. Personas de negócio não criam perfis de autorização automaticamente. O intervalo externo de coleta é dado de cada observação; o intervalo de polling da tela é configuração independente do frontend (`VITE_REFRESH_INTERVAL_MS`, ver [Frontend](#frontend)).

## Frontend

React/TypeScript com Vite, em camadas de dependência única: **pages → hooks → services**. Detalhes e passos de verificação no [README do frontend](../frontend/README.md).

- `pages/` monta a tela e só conversa com hooks; não faz HTTP nem guarda timer.
- `hooks/` guarda o estado da tela: `useServices` busca a lista (dado, carregando, erro, horário da última busca) e repete a busca por `usePolling`, que agenda a próxima só depois que a anterior termina, pausa com a aba oculta e cancela a requisição pendente ao sair (`AbortController`).
- `services/` é o único lugar com HTTP: `api.ts` (base `VITE_API_URL`, erros `{ error: { code, message } }` viram `ApiError`) e `services.service.ts` (`GET /services`). Sem `VITE_API_URL`, devolve os dados de demonstração.
- `MonitoringProvider` (em `App.tsx`, acima das rotas) lê `VITE_REFRESH_INTERVAL_MS` uma vez e entrega o intervalo pelo `MonitoringContext` (`useMonitoring`): padrão 30 s, limitado entre 5 s e 2.147.483.647 ms (o maior atraso do `setTimeout`).

Fluxo de uma atualização: `usePolling` dispara → `useServices` chama `fetchServices` → backend `GET /services` → estado novo → a tabela e o selo "Última atualização" mudam sem recarregar a página. Uma falha mantém o último dado na tela e marca o selo como desatualizado.

## Modelo de dados

Fonte física: [schema.sql](../database/schema.sql). Modelos persistente/OO e sequências: [UML](arquitetura/modelagem-uml.md).

| Tabela | Responsabilidade | Relações |
|---|---|---|
| services | ID interno BIGINT, external_id textual único, cadastro, region_code e estado atual. | 1 serviço para 0..N coletas. |
| collections | Métricas normalizadas em GB, intervalo, snapshot regional, intensidade usada e resultados disponíveis. | service_id obrigatório, FK RESTRICT. |
| users | Email e hash bcrypt para o acesso administrativo futuro. | Sem propriedade de serviços/coletas. |
| access_entries | Somente ID técnico, IP e instante de entrada. | Sem FK de usuário. |

CPU, GB e intervalo positivo são obrigatórios quando status=ok. Status de métricas (ok/erro/sem_metricas) é independente de calculation_status (nao_calculado/disponivel/indisponivel). Sem cálculo, campos ambientais ficam nulos; falha de carbono preserva métricas e não usa emissão zero. Quando disponível, cálculo exige região histórica, intensidade e resultados completos. JSONB preserva a resposta bruta, sem duplicação manual de todo o modelo.

## Histórico e falhas

Energia usa numeric(20,12) e emissão numeric(24,12), mantendo 0,00000015 kWh por coleta e resolução de 10⁻¹² em ambas. Intensidade/potência permanecem numeric(14,6). Quatro índices explícitos somam-se aos cinco automáticos das quatro PKs e UNIQUE externo: nove no total. Casos de uso atuais constam na UML, com dashboard público e consulta/configuração autenticadas, sem ampliar a auditoria.

Cada coleta futura é nova linha. FK impede excluir serviço referenciado, mas somente inserção de coletas é regra dos repositories/permissões, não trigger implementado. updated_at precisa ser atribuído nos UPDATEs. Região e intensidade de cada coleta não são consultadas retrospectivamente no cadastro atual.

Falha de descoberta não autoriza remover todos os serviços. Semântica externa de 404/500 permanece ambígua; o contrato documentado foi corrigido para explicitar essa pendência. Ausência de coordenadas não invalida o serviço/métricas.

## Entrada simples e autorização

Primeira abertura por sessão de navegação em uma aba; reload e navegação interna não geram nova entrada. Sem polling ou worker. Backend observa IP considerando só proxies confiáveis e define horário; IP não equivale à identidade de pessoa. Consulta por responsáveis autorizados usa JWT administrativo, período/paginação e não cria outro evento de entrada. Sem perfis adicionais, tenants, logs HTTP ou tentativas de login. Tabela e fluxos modelados por solicitação de Vinicius; issue/sprint/retencão e mecanismo continuam pendentes, sem aprovação presumida do PO.

## Inicialização e evolução

Schema inicial em transação, reaplicável ao mesmo modelo. Banco anterior com bytes é recusado pelo guard; precisa de migração numerada conforme ADR 0002, sem conversão presumida nem remoção de dados. Não há seed. No `compose.yaml` (#27) o serviço `postgres` (16-alpine) aplica o schema na primeira criação do volume nomeado `pgdata`, que preserva os dados entre reinícios; só `docker compose down -v` os apaga. Comandos de validação isolada: [README do banco](../database/README.md). Precisão e fontes: [cálculos](calculos.md).
