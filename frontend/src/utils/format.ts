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

/** Duração em segundos → "7 h 35 min", "2 min 10 s" ou "45 s". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const rest = seconds % 60;
  if (days) return hours ? `${days} d ${hours} h` : `${days} d`;
  if (hours) return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  if (minutes) return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
  return `${rest} s`;
}
