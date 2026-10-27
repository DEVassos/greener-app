// Série ilustrativa de emissões para o modo demonstração (sem VITE_API_URL).
// Segue o modelo do ADR 0006 (potência × intervalo × intensidade regional) com métricas sintéticas:
// a mesma estação e o mesmo horário sempre dão o mesmo valor, então "Atualizar" não embaralha a curva.

import type { EmissionPoint, EmissionsQuery, EmissionsSeries } from './emissions.types';
import { groupPoints, totalsOf } from '../utils/emissions';

/** Intervalo entre coletas do worker (POLLING_INTERVAL_MS do .env.example). */
const INTERVAL_MS = 30_000;

const BUCKET_MS = { '15min': 15 * 60_000, '1h': 60 * 60_000 } as const;

/** Perfil de cada serviço do demo-data: carga média de CPU, memória, disco e intensidade da região (g/kWh). */
const PROFILES: Record<string, { cpu: number; memoryGb: number; diskGb: number; intensity: number }> = {
  'fraud-detector': { cpu: 68, memoryGb: 6.2, diskGb: 40, intensity: 377 },
  'recommendation-ai': { cpu: 74, memoryGb: 12.5, diskGb: 85, intensity: 295 },
  'audit-stream': { cpu: 41, memoryGb: 3.1, diskGb: 120, intensity: 465 },
  'checkout-worker': { cpu: 45, memoryGb: 2.4, diskGb: 15, intensity: 377 },
  'reporting-batch': { cpu: 52, memoryGb: 8.0, diskGb: 210, intensity: 40 },
  'email-dispatcher': { cpu: 30, memoryGb: 1.5, diskGb: 10, intensity: 85 },
  'inventory-sync': { cpu: 25, memoryGb: 1.0, diskGb: 8, intensity: 40 },
};

/** Ruído determinístico em [0, 1) a partir de um número. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function hash(text: string): number {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function emptyPoint(t: number, failed: boolean): EmissionPoint {
  return {
    t,
    collections: 1,
    failed: failed ? 1 : 0,
    notCalculated: failed ? 0 : 1,
    energyKwh: null,
    co2eGrams: null,
    co2eMinGrams: null,
    co2eMaxGrams: null,
  };
}

/** Uma coleta sintética por intervalo do worker, entre `from` (incluído) e `to` ou agora (excluídos). */
function demoCollections(serviceId: string, fromMs: number, toMs: number): EmissionPoint[] {
  const profile = PROFILES[serviceId] ?? { cpu: 40, memoryGb: 2, diskGb: 20, intensity: 100 };
  const seed = hash(serviceId);
  const end = Math.min(toMs, Date.now());
  const points: EmissionPoint[] = [];

  for (let t = Math.ceil(fromMs / INTERVAL_MS) * INTERVAL_MS; t < end; t += INTERVAL_MS) {
    const slot = t / INTERVAL_MS;
    // Os mesmos casos do demo-data: sem métricas sempre; indisponível nos últimos 21 minutos
    if (serviceId === 'inventory-sync') {
      points.push(emptyPoint(t, true));
      continue;
    }
    if (serviceId === 'email-dispatcher' && t > Date.now() - 21 * 60_000) {
      points.push(emptyPoint(t, true));
      continue;
    }
    // Falhas esporádicas: ~0,5 % de erro de coleta e ~0,5 % de cálculo indisponível
    const failure = noise(slot + seed * 7);
    if (failure < 0.01) {
      points.push(emptyPoint(t, failure < 0.005));
      continue;
    }

    // Carga com ciclo diário (pico à tarde no horário local), ruído e picos ocasionais
    const date = new Date(t);
    const hour = date.getHours() + date.getMinutes() / 60;
    const daily = 0.75 + 0.35 * Math.sin(((hour - 9) / 24) * 2 * Math.PI);
    const spike = noise(slot * 3 + seed) > 0.995 ? 1.6 : 1;
    const cpu = Math.min(100, profile.cpu * daily * spike * (0.9 + 0.2 * noise(slot + seed)));
    const watts = cpu + profile.memoryGb * 0.375 + profile.diskGb * 0.01;
    const energyKwh = (watts * INTERVAL_MS) / 1000 / 3_600_000;
    const co2eGrams = energyKwh * profile.intensity;
    points.push({ t, collections: 1, failed: 0, notCalculated: 0, energyKwh, co2eGrams, co2eMinGrams: co2eGrams, co2eMaxGrams: co2eGrams });
  }
  return points;
}

export function demoEmissions(query: EmissionsQuery): Promise<EmissionsSeries> {
  const fromMs = Date.parse(query.from);
  const collections = demoCollections(query.serviceId, fromMs, Date.parse(query.to));
  const points = query.bucket === 'coleta' ? collections : groupPoints(collections, BUCKET_MS[query.bucket], fromMs);
  const intensity = PROFILES[query.serviceId]?.intensity ?? null;
  return Promise.resolve({
    bucket: query.bucket,
    points,
    totals: totalsOf(collections, collections.some((point) => point.co2eGrams !== null) ? intensity : null),
    truncated: false,
    discarded: 0,
  });
}
