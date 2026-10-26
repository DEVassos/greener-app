import type { RequestHandler } from 'express';
import { getServiceComparison, getServices } from './services.service';
import { ServiceRepository } from './services.repository';
import { ValidationError } from '../../shared/errors';

export function servicesController(repository: ServiceRepository): RequestHandler {
  return async (_req, res) => { res.status(200).json(await getServices(repository)); };
}

function comparisonInput(query: Record<string, unknown>) {
  const ids = query.ids;
  if (typeof ids !== 'string') throw new ValidationError('ids deve informar de 2 a 10 serviços.');
  const values = ids.split(',');
  if (values.length < 2 || values.length > 10 || values.some(id => !/^[1-9]\d*$/.test(id)) || new Set(values).size !== values.length) {
    throw new ValidationError('ids deve informar de 2 a 10 inteiros positivos distintos.');
  }
  const from = query.from; const to = query.to;
  if (typeof from !== 'string' || typeof to !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(from) || !/^\d{4}-\d{2}-\d{2}T/.test(to) || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    throw new ValidationError('from e to devem ser ISO 8601.');
  }
  const start = new Date(from); const end = new Date(to);
  if (start >= end) throw new ValidationError('from deve ser anterior a to.');
  if (end.getTime() - start.getTime() > 31 * 24 * 60 * 60 * 1000) throw new ValidationError('O período máximo é de 31 dias.');
  return { ids: values, from: start, to: end };
}

export function compareServicesController(repository: ServiceRepository): RequestHandler {
  return async (req, res) => { res.status(200).json(await getServiceComparison(repository, comparisonInput(req.query))); };
}
