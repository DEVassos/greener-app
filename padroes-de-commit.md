# Padrões de Commit e Contribuição

Para mantermos o histórico do nosso repositório limpo, organizado e garantir a pontuação máxima no critério de **Rastreabilidade (ES04)** da avaliação da Fatec, toda a equipe deve seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/).

## Estrutura do Commit

A estrutura de um commit deve sempre seguir o formato abaixo:

```text
<tipo>(<escopo opcional>): <descrição curta no imperativo> <#ID-da-Issue>
```

**Exemplo Prático:**
`feat(frontend): adiciona tabela de serviços na dashboard #FE-03`

---

## 1. Tipos de Commit (`<tipo>`)

Sempre inicie a mensagem do seu commit com um dos prefixos abaixo:

- **`feat`**: Adiciona uma nova funcionalidade ao projeto (Ex: criar uma tela, um novo endpoint, etc).
- **`fix`**: Corrige um bug ou erro no código.
- **`docs`**: Alterações apenas na documentação (README, arquivos `.md` na pasta docs, etc).
- **`style`**: Mudanças de formatação que não afetam o significado do código (espaçamento, formatação, aspas duplas para simples, etc).
- **`refactor`**: Mudança no código que nem corrige um bug nem adiciona uma nova funcionalidade (Ex: reorganizar uma função, renomear variáveis para melhorar a leitura).
- **`test`**: Adiciona testes ausentes ou corrige testes existentes.
- **`chore`**: Atualizações de tarefas de build, configurações de pacotes, dependências (`package.json`), docker ou ajustes que não alteram o código de produção.

---

## 2. Escopo (`<escopo opcional>`)

O escopo ajuda a identificar qual área do projeto foi alterada. Para o nosso projeto, recomendamos usar os seguintes escopos:

- `(frontend)` ou `(ui)`: Alterações no React/Dashboard.
- `(backend)` ou `(api)`: Alterações no Node.js/Integrações.
- `(db)` ou `(database)`: Alterações nos scripts SQL ou DDL.
- `(devops)` ou `(docker)`: Alterações na infraestrutura.

---

## 3. Descrição e Rastreabilidade (Obrigatório)

- **Verbo no imperativo:** Use "adiciona", "corrige", "muda" em vez de "adicionado", "corrigindo" (Ex: `fix: corrige calculo de carbono` em vez de `fix: arrumado erro de calculo`).
- **ID da Issue:** **NUNCA** faça um commit sem vincular a Issue correspondente ao final da linha. É isso que o professor vai avaliar para dar a nota de gestão.

### Exemplos Certos ✅

- `feat(backend): implementa a busca da api de carbono #BE-04`
- `fix(db): resolve erro de chave estrangeira na tabela coletas #DB-01`
- `docs: atualiza plano de entregas da sprint 1 #PO-01`
- `chore(docker): adiciona variaveis de ambiente no compose #DEVOPS-02`

### Exemplos Errados ❌

- `feat: tela nova feita` _(Faltou o escopo e o ID da Issue)_
- `Update README.md` _(Não usou o padrão conventional)_
- `backend arrumado #BE-02` _(Faltou o tipo 'fix' e escopo)_

---

## 4. Regras de Ouro da Equipe

1. **Commits Pequenos e Frequentes:** Não faça um commit gigante no final do dia com dezenas de arquivos de pastas diferentes. Quebre as entregas.
2. **Nunca suba na branch `main` diretamente:** Todo desenvolvimento deve ser feito em uma branch separada (ex: `feat/FE-03-tabela-servicos`) e enviado para a `main` via **Pull Request (PR)**.
