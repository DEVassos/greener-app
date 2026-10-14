import type { QueryExecutor } from '../../db/connection';
import type { DatabaseId, NewCollection, StoredCollection } from '../../shared/persistence.types';

export interface CollectionFilters { serviceId: DatabaseId | null; from: Date | null; to: Date | null; limit: number }
export interface CollectionListRow {
  id: DatabaseId; service_id: DatabaseId; collected_at: Date; status: 'ok' | 'erro' | 'sem_metricas';
  cpu_percent: string | null; memory_gb: string | null; disk_gb: string | null; network_gb: string | null; error_message: string | null;
}

export class CollectionRepository {
  constructor(private readonly db: QueryExecutor) {}
  async insert(reading: NewCollection): Promise<StoredCollection> {
    const result = await this.db.query<StoredCollection>(`
      INSERT INTO collections (service_id, collected_at, region_code, status,
        collection_interval_seconds, cpu_percent, memory_gb, disk_gb, network_gb,
        metrics, error_message, calculation_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, 'nao_calculado')
      RETURNING *`, [reading.service_id, reading.collected_at, reading.region_code, reading.status,
      reading.collection_interval_seconds, reading.cpu_percent, reading.memory_gb, reading.disk_gb,
      reading.network_gb, JSON.stringify(reading.metrics), reading.error_message]);
    return result.rows[0];
  }
  async findAll(filters: CollectionFilters): Promise<CollectionListRow[]> {
    return (await this.db.query<CollectionListRow>(`
      SELECT id, service_id, collected_at, status, cpu_percent, memory_gb, disk_gb, network_gb, error_message
      FROM collections
      WHERE ($1::bigint IS NULL OR service_id = $1)
        AND ($2::timestamptz IS NULL OR collected_at >= $2)
        AND ($3::timestamptz IS NULL OR collected_at <= $3)
      ORDER BY collected_at DESC, id DESC
      LIMIT $4`, [filters.serviceId, filters.from, filters.to, filters.limit])).rows;
  }
}
