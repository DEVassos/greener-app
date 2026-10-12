import type { QueryExecutor } from '../../db/connection';
import type { NewCollection, StoredCollection } from '../../shared/persistence.types';

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
}
