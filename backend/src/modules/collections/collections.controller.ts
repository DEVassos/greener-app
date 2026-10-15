import type { RequestHandler } from 'express';
import { ValidationError } from '../../shared/errors';
import { ServiceRepository } from '../services/services.repository';
import { CollectionRepository, type CollectionFilters } from './collections.repository';
import { getCollections } from './collections.service';

function date(value: unknown, name: string): Date | null {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) throw new ValidationError(`${name} deve ser ISO 8601.`);
  return new Date(value);
}
function filters(query: Record<string, unknown>): CollectionFilters {
  const serviceId = query.service_id;
  if (serviceId !== undefined && (typeof serviceId !== 'string' || !/^[1-9]\d*$/.test(serviceId))) throw new ValidationError('service_id deve ser inteiro positivo.');
  const from = date(query.from, 'from'); const to = date(query.to, 'to');
  if (from && to && from > to) throw new ValidationError('from deve ser anterior ou igual a to.');
  const limitValue = query.limit ?? '50';
  if (typeof limitValue !== 'string' || !/^[1-9]\d*$/.test(limitValue) || Number(limitValue) > 500) throw new ValidationError('limit deve ser inteiro entre 1 e 500.');
  return { serviceId: serviceId ?? null, from, to, limit: Number(limitValue) };
}
export function collectionsController(collections: CollectionRepository, services: ServiceRepository): RequestHandler {
  return async (req, res) => { res.status(200).json(await getCollections(collections, services, filters(req.query))); };
}
