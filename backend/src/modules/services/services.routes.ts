import { Router } from 'express';
import { servicesController, summaryController } from './services.controller';
import { ServiceRepository } from './services.repository';

export function servicesRoutes(repository: ServiceRepository): Router {
  const router = Router();
  router.get('/api/services/summary', summaryController(repository));
  router.get('/api/services', servicesController(repository));
  return router;
}
