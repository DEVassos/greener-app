#!/usr/bin/env bash
# gerado pelo agilekit — edite em DEVassos/agilekit (repo/.github/scripts/check-forbidden.sh)
#
# Procura padrões proibidos/arriscados pelas restrições do desafio e pela rubrica:
#   ERRO : ORM em package.json (RP03/BD02); arquivo .env versionado (segredos)
#   AVISO: `any` sem "// any-justificado:" (TP02); SQL com ${} ou concatenação em texto SQL
#          sem "// sql-seguro:" (BD02); catch vazio (TP03); knex (query builder)
# Uso: check-forbidden.sh [raiz]

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/conventions.sh
source "$HERE/lib/conventions.sh"
[ -n "${1:-}" ] && ROOT="$(cd "$1" && pwd)"
cd "$ROOT"
need_jq

# arquivos rastreados pelo git (pathspec do git: '*' atravessa diretórios)
listar() { git ls-files -- "$@" 2>/dev/null | grep -vE '(^|/)node_modules/|(^|/)dist/' || true; }

# 1. ORM (RP03)
while IFS= read -r pkg; do
  [ -n "$pkg" ] || continue
  deps="$(jq -r '((.dependencies // {}) + (.devDependencies // {})) | keys[]' "$pkg" 2>/dev/null || true)"
  for orm in $ORM_FORBIDDEN; do
    if printf '%s\n' "$deps" | grep -Fxq "$orm"; then err "ORM '$orm' em $pkg — proibido (RP03/BD02): use o driver 'pg' com SQL explícito e parametrizado" "file=$pkg"; fi
  done
  for qb in $ORM_WARN; do
    if printf '%s\n' "$deps" | grep -Fxq "$qb"; then warn "query builder '$qb' em $pkg — o avaliador procura SQL explícito nos repositories; prefira 'pg' puro" "file=$pkg"; fi
  done
done < <(listar '*package.json')

# 2. .env versionado
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in *.env.example|*.env.sample|*.env.template) continue ;; esac
  err "arquivo de ambiente versionado: $f — remova do índice (git rm --cached) e mantenha só .env.example" "file=$f"
done < <(listar | grep -E '(^|/)\.env(\.[A-Za-z0-9_.-]+)?$' || true)

TS_FILES="$(listar '*.ts' '*.tsx' | grep -v '\.d\.ts$' || true)"

# 3. any sem justificativa (TP02)
while IFS= read -r f; do
  [ -n "$f" ] || continue
  while IFS= read -r l; do
    [ -n "$l" ] || continue; ln="${l%%:*}"
    warn "'any' sem '// any-justificado: motivo' em $f:$ln (TP02)" "file=$f,line=$ln"
  done < <(grep -nE '(:|<|,| as )[[:space:]]*any([^A-Za-z0-9_]|$)' "$f" 2>/dev/null | grep -v 'any-justificado' || true)
done <<< "$TS_FILES"

# 4. SQL interpolado / concatenado (BD02)
while IFS= read -r f; do
  [ -n "$f" ] || continue
  while IFS= read -r l; do
    [ -n "$l" ] || continue; ln="${l%%:*}"
    warn "SQL com interpolação \${} em $f:$ln — envie valores como parâmetros (\$1, \$2) ou marque '// sql-seguro: motivo' se for identificador de whitelist (BD02)" "file=$f,line=$ln"
  done < <(grep -nE '`[^`]*(SELECT|INSERT|UPDATE|DELETE|WHERE|FROM)[^`]*\$\{' "$f" 2>/dev/null | grep -v 'sql-seguro' || true)
  while IFS= read -r l; do
    [ -n "$l" ] || continue; ln="${l%%:*}"
    warn "SQL concatenado com '+' em $f:$ln — use parâmetros (BD02)" "file=$f,line=$ln"
  done < <(grep -nE "[\"'][^\"']*(SELECT|INSERT|UPDATE|DELETE|WHERE)[^\"']*[\"'][[:space:]]*\+[[:space:]]*[A-Za-z_]" "$f" 2>/dev/null | grep -v 'sql-seguro' || true)
done <<< "$TS_FILES"

# 5. catch vazio (TP03)
while IFS= read -r f; do
  [ -n "$f" ] || continue
  while IFS= read -r l; do
    [ -n "$l" ] || continue; ln="${l%%:*}"
    warn "catch vazio em $f:$ln — trate ou relance a exceção com mensagem compreensível (TP03)" "file=$f,line=$ln"
  done < <(grep -nE 'catch[[:space:]]*(\([^)]*\))?[[:space:]]*\{[[:space:]]*\}' "$f" 2>/dev/null || true)
done <<< "$TS_FILES"

finish "check-forbidden"
