import type { QueryExecutor } from '../../db/connection';
import type { DatabaseId, DiscoveredService, ServiceStatus, StoredService } from '../../shared/persistence.types';

export class ServiceRepository {
  constructor(private readonly db: QueryExecutor) {}
  async findAll(): Promise<StoredService[]> {
    return (await this.db.query<StoredService>('SELECT * FROM services ORDER BY id')).rows;
  }
  async findById(id: DatabaseId): Promise<StoredService | null> {
    return (await this.db.query<StoredService>('SELECT * FROM services WHERE id = $1', [id])).rows[0] ?? null;
  }
  async upsert(service: DiscoveredService, observedAt: Date): Promise<StoredService> {
    const result = await this.db.query<StoredService>(`
      INSERT INTO services (external_id, name, region_code, country, region, city,
        latitude, longitude, first_seen_at, last_seen_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name,
        region_code = EXCLUDED.region_code, country = EXCLUDED.country, region = EXCLUDED.region,
        city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
        last_seen_at = EXCLUDED.last_seen_at, updated_at = now(),
        status = CASE WHEN services.status = 'removido' THEN 'ativo' ELSE services.status END
      RETURNING *`, [service.external_id, service.name, service.region_code, service.country,
      service.region, service.city, service.latitude, service.longitude, observedAt]);
    return result.rows[0];
  }
  async updateStatus(id: DatabaseId, status: ServiceStatus): Promise<StoredService | null> {
    return (await this.db.query<StoredService>(`
      UPDATE services SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])).rows[0] ?? null;
  }
  /** Só chamar após descoberta completa válida; [] válido remove todos logicamente. */
  async markMissingAsRemoved(externalIds: string[]): Promise<StoredService[]> {
    return (await this.db.query<StoredService>(`
      UPDATE services SET status = 'removido', updated_at = now()
      WHERE NOT (external_id = ANY($1::text[])) AND status <> 'removido' RETURNING *`, [externalIds])).rows;
  }
}
