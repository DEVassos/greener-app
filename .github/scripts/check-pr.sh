#!/usr/bin/env bash
# gerado pelo agilekit — edite em DEVassos/agilekit (repo/.github/scripts/check-pr.sh)
#
# Valida metadados de um Pull Request do GreenER (Git Flow + rastreabilidade ES04 + DoD ES07):
#   título no padrão de commit; branch de origem no padrão; base correta (develop p/ trabalho,
#   main só p/ release/hotfix); corpo com "Closes #n"; ≥1 label RF/RNF (ou tipo:processo|bug);
#   checklist sem "- [ ]" pendente (aceita "N/A — motivo"); sem placeholders nem rodapé "Generated with …"; aviso >400 linhas.
# PR em rascunho: erros viram avisos.
# Uso: check-pr.sh <número>            (usa gh pr view)
#      check-pr.sh --json <arquivo>     (JSON já exportado — testes)

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/conventions.sh
source "$HERE/lib/conventions.sh"
need_jq

CAMPOS='number,title,body,headRefName,baseRefName,labels,isDraft,additions,deletions,author'
if [ "${1:-}" = "--json" ]; then
  FIXTURE=1; PR_JSON="$(cat "$2")"
elif [ -n "${1:-}" ]; then
  need_gh
  PR_JSON="$(gh pr view "$1" --json "$CAMPOS")"
else
  sed -n '2,11p' "$0"; exit 2
fi

j() { printf '%s' "$PR_JSON" | jq -r "$1"; }
NUM="$(j '.number')"; TITLE="$(j '.title')"; BODY="$(j '.body // ""')"
HEAD_REF="$(j '.headRefName')"; BASE_REF="$(j '.baseRefName')"; DRAFT="$(j '.isDraft')"
AUTHOR="$(j '.author.login // ""')"; ADD="$(j '.additions // 0')"; DEL="$(j '.deletions // 0')"
LABELS="$(j '[.labels[].name] | join("\n")')"

if [ "$AUTHOR" = "dependabot" ] || [ "$AUTHOR" = "app/dependabot" ] || printf '%s' "$HEAD_REF" | grep -q '^dependabot/'; then
  info "PR #$NUM do Dependabot: validações do time não se aplicam."; exit 0
fi

# bootstrap do repositório: enquanto develop não existe, um PR de trabalho pode ter base main
develop_inexistente() {
  [ "${AGILEKIT_BOOTSTRAP:-}" = "1" ] && return 0
  [ "${FIXTURE:-0}" = 1 ] && return 1
  local repo; repo="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)}"
  [ -n "$repo" ] || return 1
  ! gh api "repos/$repo/branches/develop" >/dev/null 2>&1
}
# em rascunho, erro vira aviso
fail() { if [ "$DRAFT" = "true" ]; then warn "(rascunho) $1"; else err "$1"; fi; }

info "PR #$NUM — $HEAD_REF → $BASE_REF — @$AUTHOR — +$ADD/-$DEL — draft=$DRAFT"

# 1. título
if printf '%s' "$TITLE" | grep -Eq "$RE_COMMIT_HEADER"; then ok "título no padrão"; else
  fail "título fora do padrão: \"$TITLE\". Use: type(scope): descrição (#n) [RFxx]"
fi
if [ "${#TITLE}" -gt "$SUBJECT_MAX" ]; then warn "título com ${#TITLE} caracteres (máximo $SUBJECT_MAX)"; fi

# 2. branch de origem e 3. base (Git Flow)
TIPO=""
if printf '%s' "$HEAD_REF" | grep -Eq "$RE_WORK_BRANCH"; then TIPO=trabalho
elif printf '%s' "$HEAD_REF" | grep -Eq "$RE_RELEASE_BRANCH"; then TIPO=release
elif printf '%s' "$HEAD_REF" | grep -Eq "$RE_HOTFIX_BRANCH"; then TIPO=hotfix
else
  fail "branch de origem fora do padrão: \"$HEAD_REF\". Use ${WORK_BRANCH_TYPES//|//}/<nº-issue>-slug, release/sprint-N ou hotfix/<nº-issue>-slug"
fi
case "$TIPO" in
  trabalho)
    if [ "$BASE_REF" = "develop" ]; then ok "base develop (Git Flow)"
    elif [ "$BASE_REF" = "main" ] && develop_inexistente; then ok "bootstrap: develop ainda não existe, PR para main aceito uma única vez"
    else fail "branch de trabalho deve ter base 'develop' (base atual: '$BASE_REF'). Edite a base do PR."; fi ;;
  release)
    if [ "$BASE_REF" = "main" ]; then ok "release → main"; else fail "release/* deve ter base 'main' (atual: '$BASE_REF')"; fi ;;
  hotfix)
    if [ "$BASE_REF" = "main" ] || [ "$BASE_REF" = "develop" ]; then ok "hotfix → $BASE_REF"; else fail "hotfix/* deve ter base 'main' (e um segundo PR para 'develop')"; fi ;;
esac

# 4. corpo: Closes #n (release dispensa)
N_BRANCH="$(issue_da_branch "$HEAD_REF")"
if [ "$TIPO" != "release" ]; then
  if printf '%s' "$BODY" | grep -Eq "$RE_PR_CLOSES"; then
    ok "corpo referencia a issue (Closes/Fixes/Resolves/Refs #n)"
    if [ -n "$N_BRANCH" ] && ! printf '%s' "$BODY" | grep -Eq "#${N_BRANCH}([^0-9]|$)"; then
      warn "o corpo não cita a issue #$N_BRANCH do nome da branch"
    fi
  else
    fail "corpo sem 'Closes #n' (ou Fixes/Resolves/Refs). A issue é a chave de rastreabilidade (ES04)."
  fi
fi

# 5. labels
if [ "$TIPO" = "release" ]; then ok "release: labels não exigidas"; else
  if printf '%s\n' "$LABELS" | grep -Eq "$RE_LABEL_REQ|$RE_LABEL_ALT"; then ok "label de requisito/tipo presente"; else
    fail "adicione ao menos uma label RFxx/RNFxx (ou tipo:processo / tipo:bug). As labels da issue são herdadas pelo /pr."
  fi
fi

# 6. checklist, placeholders e co-autoria
PENDENTES="$(printf '%s\n' "$BODY" | grep -nE '^[[:space:]]*[-*] \[ \]' | grep -viE 'N/A' || true)"
if [ -n "$PENDENTES" ]; then
  while IFS= read -r l; do fail "item da DoD-PR não marcado nem justificado com 'N/A — motivo': ${l#*:}"; done <<< "$PENDENTES"
else ok "DoD-PR sem pendências"; fi
if printf '%s' "$BODY" | grep -Fq '_(preencha)_'; then fail "o corpo ainda contém '_(preencha)_'"; fi
if printf '%s' "$BODY" | grep -iq 'generated with'; then fail "o corpo contém 'Generated with …' (rodapé de ferramenta de IA): remova. Quem usou IA explica isso em texto no PR; atribuição de ferramenta não entra"; fi
if printf '%s\n' "$BODY" | grep -Eq '^## Co-autoria'; then
  COAUT="$(printf '%s\n' "$BODY" | awk '/^## Co-autoria/{f=1; next} /^## /{f=0} f' | grep -oE '@[A-Za-z0-9-]+' || true)"
  if [ -n "$COAUT" ] && equipe_disponivel; then
    LOGINS="$(equipe_logins)"
    while IFS= read -r c; do
      [ -n "$c" ] || continue
      printf '%s\n' "$LOGINS" | grep -Fxq "${c#@}" || fail "co-autor $c não está em .github/equipe.json"
    done <<< "$COAUT"
  fi
fi

# 7. tamanho
if [ $((ADD + DEL)) -gt "$PR_MAX_LINES" ]; then
  warn "PR com $((ADD + DEL)) linhas alteradas (acordo: ≤$PR_MAX_LINES). Considere dividir."
fi

finish "check-pr"
