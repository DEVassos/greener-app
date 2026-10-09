# Arquitetura — modelo de dados integrado

Esta branch integra localmente UML e DDL para revisão; não entrega backend, worker, JWT ou auditoria em execução. Base SQL de Lucas (#5/#44), modelagem #28; a exceção autorizada de trabalhar na branch dele está no [registro de integração](arquitetura/integracao-modelagem-banco.md). Nome EcoPulse e transição #68 respeitados, sem renomeação geral.

## Responsabilidades e fluxo projetado

Metrics API → worker futuro → validação de métricas → repositories pg → PostgreSQL → API REST futura → dashboard. Carbon API alimenta cálculo na Sprint 2. React/TS e Node/TS são obrigatórios, mas não implementados por esta tarefa. SQL de dados ficará exclusivamente nos repositories com parâmetros; sem ORM/query builder.

Dashboard público; configuração e consulta de entradas exigirão JWT no backend com users administrativos. Personas de negócio não criam perfis de autorização automaticamente. O intervalo externo de coleta é dado de cada observação; o intervalo de polling da tela será configuração independente.

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

Schema inicial em transação, reaplicável ao mesmo modelo. Banco anterior com bytes é recusado pelo guard; precisa de migração numerada conforme ADR 0002, sem conversão presumida nem remoção de dados. Não há seed ou compose nesta branch; execução oficial futura Docker e volume persistente precisam ser entregues pela infraestrutura. Comandos de validação isolada: [README do banco](../database/README.md). Precisão e fontes: [cálculos](calculos.md).
