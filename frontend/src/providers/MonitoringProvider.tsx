import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { MonitoringContext } from '../contexts/MonitoringContext';

const DEFAULT_INTERVAL_MS = 30_000;
/** Abaixo disso o dashboard sobrecarregaria o backend sem ganho visível. */
const MIN_INTERVAL_MS = 5_000;

/** Lê VITE_REFRESH_INTERVAL_MS; valor ausente ou inválido usa o padrão de 30 s. */
function readInterval(): number {
  const value = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_INTERVAL_MS;
  return Math.max(value, MIN_INTERVAL_MS);
}

export default function MonitoringProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ refreshIntervalMs: readInterval() }), []);
  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}
