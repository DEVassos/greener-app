// Formatação de números e horários no padrão brasileiro.

/** 0.3843 → "0,384" (com `decimals` casas). */
export function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Número com `digits` algarismos significativos, sem arredondar a parte inteira.
 * Com 2: 0.04 → "0,040" · 0.5 → "0,50" · 0.0014 → "0,0014" · 0.0996 → "0,10" · 12.3 → "12" · 123.4 → "123".
 * Zero é resultado de cálculo e sai "0"; valor ausente (null) continua com o MissingValue de quem chama.
 */
export function formatSignificant(value: number, digits: number): string {
  if (value === 0) return '0';
  // Arredonda antes de contar as casas: 0.0996 vira 0.10, não "0,100"
  const rounded = Number(value.toPrecision(digits));
  const magnitude = Math.floor(Math.log10(Math.abs(rounded)));
  const decimals = Math.max(0, digits - 1 - magnitude);
  return formatNumber(decimals === 0 ? value : rounded, decimals);
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
