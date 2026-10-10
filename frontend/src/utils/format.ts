// Formatação de números e horários no padrão brasileiro.

/** 0.3843 → "0,384" (com `decimals` casas). */
export function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** ISO 8601 → "08:52:14". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** ISO 8601 → "07/10 08:52:14". */
export function formatDayTime(iso: string): string {
  const day = new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${day} ${formatTime(iso)}`;
}
