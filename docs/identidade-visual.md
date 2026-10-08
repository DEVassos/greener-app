# GreenER — Identidade Visual e Diretrizes de Design

Este documento detalha a identidade visual, a paleta de cores, os princípios de design e as diretrizes de interface do aplicativo **GreenER**, com foco em tecnologia, sustentabilidade e clareza de dados.

---

## 1. Conceito e Tema

O GreenER adota um **tema escuro (Dark Theme)** com uma estética moderna voltada para sistemas de monitoramento corporativo e infraestrutura em nuvem ("cara de tecnologia"). O design prioriza a legibilidade de dados densos, uso eficiente de espaço e forte apelo visual através de mapas e gráficos interativos.

---

## 2. Paleta de Cores

A paleta de cores foi estruturada para distinguir claramente elementos funcionais, de marca e de alerta (evitando confusão entre status de sistema e decoração).

| Uso | Descrição | Cor (Nome Amigável) | Código Hexadecimal |
| :--- | :--- | :--- | :--- |
| **Fundo** | Cor de fundo principal da aplicação | Azul-marinho escuro | `#0B1220` |
| **Superfície** | Cor de fundo para cards, painéis e contêineres | Azul-ardósia | `#131C2E` |
| **Primária** | Marca, botões de ação principal e elementos ativos | Verde-esmeralda | `#108981` |
| **Secundária** | Dados secundários, links e destaques auxiliares | Azul-ciano | `#38BDF8` |
| **Destaque da marca** | Elementos exclusivos da identidade visual/logotipo | Amarelo | `#FACC15` |
| **Alerta** | Estados de aviso (ex: serviço sem métricas) | Laranja | `#F97316` |
| **Erro** | Estados críticos (ex: serviço indisponível/caído) | Vermelho | `#EF4444` |
| **Texto** | Cor padrão para textos e títulos | Cinza-claro | `#E2E8F0` |

> **Nota de Usabilidade:** O amarelo (`#FACC15`) é utilizado restritivamente para elementos da marca. Alertas de sistema utilizam obrigatoriamente o laranja (`#F97316`) para garantir que problemas operacionais sejam imediatamente identificados sem ambiguidade.

---

## 3. Diretrizes de Interface e Componentes

### Painéis e Cards
* Utilizam a cor de superfície (`#131C2E`) sobre o fundo escuro (`#0B1220`) para criar profundidade e hierarquia visual.
* Bordas sutis e cantos arredondados para manter uma aparência limpa e profissional.

### Tipografia
* Tipografia limpa e sem serifa otimizada para painéis de dados (Dashboards).
* Contraste rigoroso com o fundo cinza-claro (`#E2E8F0`) para garantir conforto visual em monitoramento prolongado.

### Responsividade (Mobile First)
* Em telas menores (dispositivos móveis), o layout se reorganiza em uma única coluna fluida:
  1. Painel superior de indicadores gerais.
  2. Mapa reduzido.
  3. Dashboard da região/serviço selecionado.
  4. Ranking de consumo ao final da página.

---

## 4. Tipos de Gráficos e Visualização
* **Biblioteca recomendada:** Chart.js (pela simplicidade) ou ECharts (para gráficos mais fluidos e animados).
* **Abas do Dashboard:**
  * **Cards:** Visão geral rápida da região.
  * **Memória de Cálculo:** Transparência de dados (métricas brutas, coeficientes e fórmulas).
  * **Barras:** Ranking de impacto por serviço.
  * **Linha:** Evolução temporal de energia e $CO_2e$.
  * **Composição:** Detalhamento por tipo de recurso (CPU, RAM, disco e rede).