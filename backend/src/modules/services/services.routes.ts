import { Router } from 'express';
import { servicesController } from './services.controller';
import { ServiceRepository } from './services.repository';

export function servicesRoutes(repository: ServiceRepository): Router {
  const router = Router();
  router.get('/api/services', servicesController(repository));
  return router;
}
