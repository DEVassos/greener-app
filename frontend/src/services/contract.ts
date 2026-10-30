// Conferência das respostas da API em tempo de execução (#161).
// Os tipos do TypeScript somem no build (erased types) e não garantem o que o servidor mandou.

// ── Conferência tolerante: devolve `undefined` no valor inválido, e quem chama decide o que fazer ─────────────
// A página Emissões usa estas para deixar de fora (e contar) o item inválido, sem derrubar o gráfico inteiro.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Número finito ≥ 0, ou null quando o campo falta ou vem null; `undefined` quando vem inválido. */
export function amount(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Inteiro ≥ 0; `undefined` quando vem inválido. */
export function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** Data e hora (ISO 8601) em milissegundos; `undefined` quando vem inválida. */
export function instant(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const t = Date.parse(value);
  return Number.isNaN(t) ? undefined : t;
}
