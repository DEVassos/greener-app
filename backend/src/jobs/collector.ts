import type { Database } from '../db/connection';
import { withTransaction } from '../db/transaction.repository';
import type { ServiceMetricsResult, ServiceSummary } from '../integrations/metrics-api.types';
import { ServiceRepository } from '../modules/services/services.repository';
import { CollectionRepository } from '../modules/collections/collections.repository';
import type { DiscoveredService, NewCollection, StoredService } from '../shared/persistence.types';
import { AppError, ValidationError } from '../shared/errors';
import { CarbonCalculator } from '../domain/carbon-calculator';
import type { CarbonApi } from '../integrations/carbon-api';

/** A extensão #97 fornece raw e cancelamento; métodos antigos continuam tipáveis. */
export interface CollectorApi {
  listServices(signal?: AbortSignal): Promise<ServiceSummary[]>;
  getServiceMetrics(id: string, signal?: AbortSignal): Promise<ServiceMetricsResult & { raw?: Record<string, unknown> }>;
}
export interface CollectorLifecycle { start(): void; stop(): Promise<void> }

function notCalculated() {
  return { calculation_status: 'nao_calculado' as const, carbon_intensity_gco2e_per_kwh: null,
    power_watts: null, energy_kwh: null, co2e_grams: null, calculation_error_message: null };
}
function unavailableCalculation(message: string) {
  return { calculation_status: 'indisponivel' as const, carbon_intensity_gco2e_per_kwh: null,
    power_watts: null, energy_kwh: null, co2e_grams: null, calculation_error_message: message };
}

/** Arredonda à escala da coluna: a API manda resíduo de float (51.248000000000005); o JSON bruto guarda o original. */
function decimal(value: number, precision: number, scale: number): string {
  const fixed = Number.isFinite(value) ? value.toFixed(scale) : '';
  if (!fixed || Math.abs(Number(fixed)) >= 10 ** (precision - scale)) {
    throw new ValidationError('Observação fora da faixa SQL.');
  }
  return fixed;
}
function discovery(items: ServiceSummary[]): DiscoveredService[] {
  const ids = new Set<string>();
  return items.map(item => {
    const location = item.location;
    if (!item.id.trim() || !item.name.trim() || !location.regionCode.trim() || ids.has(item.id)
      || (location.latitude !== null && Math.abs(location.latitude) > 90)
      || (location.longitude !== null && Math.abs(location.longitude) > 180)) {
      throw new ValidationError('Descoberta incompleta, duplicada ou inválida.');
    }
    ids.add(item.id);
    return { external_id: item.id, name: item.name, region_code: location.regionCode,
      country: location.country, region: location.region, city: location.city,
      latitude: location.latitude === null ? null : decimal(location.latitude, 8, 6),
      longitude: location.longitude === null ? null : decimal(location.longitude, 9, 6) };
  });
}
export function observation(service: StoredService, result: Awaited<ReturnType<CollectorApi['getServiceMetrics']>>,
  at: Date): NewCollection {
  const base = { service_id: service.id, collected_at: at, region_code: service.region_code };
  if (result.status !== 'ok') return { ...base, status: result.status === 'sem_metricas' ? 'sem_metricas' : 'erro',
    collection_interval_seconds: null, cpu_percent: null, memory_gb: null, disk_gb: null, network_gb: null,
    metrics: {}, error_message: result.status === 'indisponivel' ? 'Serviço indisponível (HTTP 500).' : null,
    ...notCalculated() };
  const m = result.metrics;
  if (!Number.isInteger(m.collectionIntervalSeconds) || m.collectionIntervalSeconds < 1
    || m.collectionIntervalSeconds > 2147483647 || m.cpuPercent < 0 || m.cpuPercent > 100
    || [m.memoryGb, m.diskGb, m.networkGb].some(value => value < 0)
    || !result.raw || typeof result.raw !== 'object' || Array.isArray(result.raw)) {
    throw new ValidationError('Métricas não representáveis ou JSON bruto ausente.');
  }
  return { ...base, status: 'ok', collection_interval_seconds: m.collectionIntervalSeconds,
    cpu_percent: decimal(m.cpuPercent, 5, 2), memory_gb: decimal(m.memoryGb, 20, 9),
    disk_gb: decimal(m.diskGb, 20, 9), network_gb: decimal(m.networkGb, 20, 9),
    metrics: result.raw, error_message: null, ...notCalculated() };
}

/** HTTP fora das transações; memória guarda somente prazos desta execução. */
export class Collector implements CollectorLifecycle {
  private readonly abort = new AbortController();
  private readonly deadlines = new Map<string, { interval: number; due: number }>();
  private active?: Promise<void>;
  private timer?: ReturnType<typeof setTimeout>;
  private started = false;
  private stopping = false;
  constructor(private readonly db: Database, private readonly api: CollectorApi,
    private readonly pollingMs: number, private readonly now: () => number = Date.now,
    private readonly report: (message: string) => void = console.error,
    private readonly carbonApi?: CarbonApi, private readonly calculator = new CarbonCalculator()) {
    if (!Number.isInteger(pollingMs) || pollingMs < 1 || pollingMs > 2147483647)
      throw new ValidationError('Intervalo do dispatcher inválido.');
  }
  start(): void {
    if (this.started || this.stopping) return;
    this.started = true;
    const dispatch = () => {
      void this.run().finally(() => {
        if (!this.stopping) this.timer = setTimeout(dispatch, this.pollingMs);
      });
    };
    dispatch();
  }
  run(): Promise<void> {
    if (this.stopping) return Promise.resolve();
    return this.active ??= this.collect().catch(() => {
      if (!this.stopping) this.report('Falha no ciclo de descoberta/reconciliação; cadastro preservado.');
    }).finally(() => { this.active = undefined; });
  }
  async stop(): Promise<void> {
    this.stopping = true;
    clearTimeout(this.timer);
    this.abort.abort();
    await this.active;
  }
  private async calculate(reading: NewCollection): Promise<NewCollection> {
    if (reading.status !== 'ok' || !this.carbonApi) return reading;
    if (!reading.region_code) return { ...reading,
      ...unavailableCalculation('Não foi possível calcular: região não informada.') };
    try {
      const intensity = await this.carbonApi.getIntensity(reading.region_code);
      if (intensity.status === 'region_not_found') return { ...reading,
        ...unavailableCalculation('Não há fator de carbono para esta região.') };
      const calculation = this.calculator.calculate({ collectionIntervalSeconds: reading.collection_interval_seconds,
        cpuPercent: Number(reading.cpu_percent), memoryGb: Number(reading.memory_gb),
        diskGb: Number(reading.disk_gb), networkGb: Number(reading.network_gb) }, intensity.factor.intensityGco2ePerKwh);
      return { ...reading, calculation_status: 'disponivel',
        carbon_intensity_gco2e_per_kwh: calculation.carbonIntensityGco2ePerKwh,
        power_watts: calculation.powerWatts, energy_kwh: calculation.energyKwh,
        co2e_grams: calculation.co2eGrams, calculation_error_message: null };
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Não foi possível calcular as emissões.';
      return { ...reading, ...unavailableCalculation(message) };
    }
  }
  private async collect(): Promise<void> {
    const found = discovery(await this.api.listServices(this.abort.signal));
    if (this.stopping) return;
    const services = await withTransaction(this.db, async tx => {
      const repo = new ServiceRepository(tx);
      const rows: StoredService[] = [];
      for (const item of found) rows.push(await repo.upsert(item, new Date(this.now())));
      await repo.markMissingAsRemoved(found.map(item => item.external_id));
      return rows;
    });
    const present = new Set(found.map(item => item.external_id));
    for (const id of this.deadlines.keys()) if (!present.has(id)) this.deadlines.delete(id);
    for (const service of services) {
      if (this.stopping) return;
      const previous = this.deadlines.get(service.external_id);
      if (previous && previous.due > this.now()) continue;
      let reading: NewCollection;
      let interval = previous?.interval ?? this.pollingMs;
      try {
        const result = await this.api.getServiceMetrics(service.external_id, this.abort.signal);
        if (this.stopping) return;
        reading = await this.calculate(observation(service, result, new Date(this.now())));
        if (reading.status === 'ok') interval = reading.collection_interval_seconds * 1000;
      } catch (error) {
        if (this.stopping) return;
        reading = { service_id: service.id, collected_at: new Date(this.now()), region_code: service.region_code,
          status: 'erro', collection_interval_seconds: null, cpu_percent: null, memory_gb: null,
          disk_gb: null, network_gb: null, metrics: {},
          error_message: error instanceof AppError ? error.message : 'Falha externa ao coletar métricas.',
          ...notCalculated() };
      }
      try {
        await withTransaction(this.db, async tx => {
          await new CollectionRepository(tx).insert(reading);
          const status = reading.status === 'ok' ? 'ativo' : reading.status === 'sem_metricas' ? 'sem_metricas' : 'indisponivel';
          if (!await new ServiceRepository(tx).updateStatus(service.id, status))
            throw new ValidationError('Serviço da coleta não encontrado.');
        });
      } catch {
        this.report('Falha na persistência da coleta; transação desfeita, próximos serviços continuam.');
      }
      this.deadlines.set(service.external_id, { interval, due: this.now() + interval });
    }
  }
}
