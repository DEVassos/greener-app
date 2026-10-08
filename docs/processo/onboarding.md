# Onboarding — primeiro dia no GreenER

<!-- gerado pelo agilekit — edite em DEVassos/agilekit (repo/docs/processo/onboarding.md) -->

Checklist para cada integrante sair do zero até o primeiro PR mergeado. Tempo estimado: 60–90 min. Em caso de dúvida, procure o SM (`@travensolli`); o backup é o PO (`@henriqueptbd-cell`). A skill `onboarding` do seu assistente de IA (seção 6) percorre esta lista automaticamente.

## 1. Pré-requisitos

| Ferramenta | Versão | Como conferir | Instalação |
|---|---|---|---|
| Git (no Windows inclui o **Git Bash**) | ≥2.40 | `git --version` | https://git-scm.com |
| GitHub CLI | ≥2.60 | `gh --version` | https://cli.github.com |
| Docker Desktop (com `docker compose`) | atual | `docker compose version` | https://www.docker.com — habilitar o backend WSL 2 no Windows |
| Node.js | **≥20 LTS** | `node -v` | https://nodejs.org (ou `nvm`) |
| `jq` | qualquer | `jq --version` | **instalado pelo kit** (`install.sh`); manual: `winget install jqlang.jq` |
| VS Code (opcional) | atual | — | extensões sugeridas: ESLint, Prettier, Docker, GitLens |

## 2. Conta GitHub

- [ ] Aceitar o convite para a organização **DEVassos** e para os repositórios `greener-app` e `agilekit`.
- [ ] **E-mail verificado**: em `https://github.com/settings/emails`, adicione o e-mail que você usará no git e clique no link de verificação recebido. Sem isso o commit aparece sem login e **não conta para ES09**.
- [ ] Alternativa sem expor e-mail: usar o endereço noreply `ID+login@users.noreply.github.com` (mostrado na mesma página; é o primeiro e-mail da sua entrada em `.github/equipe.json`).
- [ ] Autenticar o CLI com os escopos que o kit usa:

```bash
gh auth login            # GitHub.com, HTTPS, autenticar pelo navegador
gh auth refresh -h github.com -s project,read:project,user:email
gh auth status
```

## 3. Clonar o projeto e instalar o kit

Clone em uma pasta local **fora de pastas sincronizadas** (OneDrive, Google Drive): a sincronização corrompe `.git` e quebra os hooks. Exemplos: `C:\dev\greener-app` ou `G:\FATEC\ABPs\ABP - 2DSM\greener-app` (caminhos com espaço funcionam, mas sempre entre aspas).

```bash
cd /c/dev                                    # ou: cd "/g/FATEC/ABPs/ABP - 2DSM"
git clone https://github.com/DEVassos/greener-app.git
cd greener-app
git clone https://github.com/DEVassos/agilekit.git agilekit   # fica dentro do clone, já no .gitignore
bash agilekit/install.sh .                   # instala hooks, .gitmessage, .agilekit/, jq e pergunta o assistente de IA (seção 6)
bash .agilekit/scripts/setup-dev.sh          # git config local + verificação do ambiente
```

O `setup-dev.sh` configura `core.hooksPath=.githooks`, `commit.template=.gitmessage`, `pull.rebase=true`, `rebase.autoStash=true`, `push.autoSetupRemote=true`, `fetch.prune=true` e, no Windows, `core.longpaths=true`. Ele **falha** se `git config user.email` não for um e-mail da sua entrada em `equipe.json` verificado no GitHub. Corrija com:

```bash
git config user.name "Seu Nome"
git config user.email "ID+login@users.noreply.github.com"   # ou o e-mail verificado
bash .agilekit/scripts/setup-dev.sh --check
```

- [ ] `setup-dev.sh --check` termina sem erros.
- [ ] `git switch develop && git pull` funciona.
- [ ] `docker compose up --build` sobe os containers (assim que existir `compose.yaml` no repositório).

## 4. Windows — detalhes que evitam dor de cabeça

| Tema | O que fazer |
|---|---|
| Terminal | Use **Git Bash** para os scripts do kit e os hooks. PowerShell serve para `docker`, `gh` e `npm`. Os assistentes de IA chamam o kit por `git agilekit-*`, que funciona em qualquer um dos dois. |
| Fim de linha | Não mude `core.autocrlf`: o `.gitattributes` do repositório força LF em `*.sh`, hooks e código, e CRLF só em `*.bat`, `*.cmd` e `*.ps1`. Se um hook falhar com `\r: command not found`, rode `git add --renormalize .` na sua branch e commite. |
| Caminhos com espaço | `ABP - 2DSM` tem espaços: sempre `cd "/g/FATEC/ABPs/ABP - 2DSM/greener-app"` entre aspas. Prefira `C:\dev\greener-app` se puder. |
| Caminhos longos | `core.longpaths=true` (feito pelo `setup-dev.sh`) evita erro em `node_modules`. |
| Conversão de caminho do MSYS | Os scripts **não** desativam a conversão de caminhos (ela é necessária para `git`, `gh` e `docker`); a única regra é nunca chamar `gh api` com barra inicial no Git Bash (`gh api repos/...`, não `gh api /repos/...`). O `jq.exe` do Windows emite CRLF; a biblioteca do kit normaliza isso. |
| Docker Desktop | Backend WSL 2 ativo; compartilhe a unidade (`G:`) em Settings → Resources → File sharing se o compose não enxergar os arquivos. |
| `jq` ausente | `install.sh` tenta `winget`; sem winget, baixa o binário para `.agilekit/bin/`, que os scripts já incluem no `PATH`. |
| Pasta sincronizada | Nunca clone dentro de OneDrive/Google Drive: hooks e `.git` quebram. |

## 5. Primeira tarefa (até o PR)

Pegue uma issue pequena (estimativa 1–2) do Sprint Backlog com o seu nome, ou peça uma ao PO. Percorra o ciclo completo uma vez:

1. `/tarefa <n>` (ou `git fetch && git switch -c feature/<n>-slug origin/develop`) — o cartão vai para "Em andamento".
2. Faça a alteração; `git commit` abre o `.gitmessage` com as regras (`type(scope): descrição (#n) [RFxx]`). Ou use `/commitar`.
3. `git push` (a branch é rastreada automaticamente); o hook recusa push em `main`/`develop`.
4. `/pr` (ou `gh pr create --base develop --fill`), preenchendo o template: `Closes #n`, "Como verificar", DoD-PR. O cartão vai para "Em revisão".
5. Peça revisão ao seu par de revisão (`equipe.json`); responda aos comentários; quando aprovado, faça o **merge commit** pela interface. A branch é apagada e a issue fechada pelo workflow `board`.

Leitura obrigatória antes do primeiro PR: [CONTRIBUTING.md](../../.github/CONTRIBUTING.md), [Como trabalhamos](README.md), [DoR/DoD](definition-of-done.md), [Quadro](quadro.md).

## 6. Assistente de IA (opcional, recomendado)

Na instalação você escolhe um ou mais assistentes. Cada um recebe as mesmas 11 skills (`onboarding`, `historia`, `tarefa`, `commitar`, `pr`, `revisar`, `daily`, `painel`, `adr`, `auditar`, `sprint`), os 5 agentes, as regras do projeto e o guard que bloqueia commit fora do padrão, push em branch protegida e co-autor fora do time. Esses arquivos ficam só na sua máquina: o git os ignora.

```bash
bash agilekit/install.sh . --llm claude          # um assistente
bash agilekit/install.sh . --llm copilot,codex   # vários; também aceita todos ou nenhum
```

| Assistente | Como abrir | Chamar uma skill | Passo extra na primeira vez |
|---|---|---|---|
| Claude Code | `claude` na raiz do clone | `/tarefa 12` | nenhum |
| GitHub Copilot | chat do VS Code em modo agente, ou `copilot` | `/tarefa 12` | confiar na pasta; no Copilot CLI, `/settings includeCoAuthoredBy off` |
| OpenAI Codex | `codex` ou extensão do VS Code | `$tarefa 12` | confiar no projeto e aprovar os hooks em `/hooks` |
| Google Antigravity | `agy` | `/tarefa 12` | confiar na pasta |

Ao abrir, o assistente recebe o contexto do dia: sprint, prazos, suas issues e PRs para revisar. No Antigravity, peça para rodar `git agilekit-context`. Para atualizar o kit, rode `bash .agilekit/scripts/kit-update.sh`; ele mantém a sua escolha. Para trocar de assistente, rode o `install.sh` de novo com outro `--llm`.

## 7. Quem procurar

| Assunto | Pessoa |
|---|---|
| Ambiente, git, hooks, kit, quadro, cerimônias, atas | SM — Gabriel `@travensolli` |
| Backlog, prioridade, critérios de aceite, cliente, plano de entregas | PO — Henrique `@henriqueptbd-cell` |
| Frontend (React + TypeScript) | Andrea `@DeaTuribio` |
| Backend (Node.js + TypeScript, APIs auxiliares) | Lucas `@LUCASAMR23` |
| Banco de dados (PostgreSQL, `schema.sql`, repositories) | Vinicius `@viniciusaugusto1997` |
