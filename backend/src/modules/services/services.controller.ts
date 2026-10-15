import type { RequestHandler } from 'express';
import { getServices } from './services.service';
import { ServiceRepository } from './services.repository';

export function servicesController(repository: ServiceRepository): RequestHandler {
  return async (_req, res) => { res.status(200).json(await getServices(repository)); };
}
