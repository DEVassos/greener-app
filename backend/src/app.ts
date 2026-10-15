import express from 'express';
import { healthRoutes } from './modules/health/health.routes';
import { collectionsRoutes } from './modules/collections/collections.routes';
import { CollectionRepository } from './modules/collections/collections.repository';
import { servicesRoutes } from './modules/services/services.routes';
import { ServiceRepository } from './modules/services/services.repository';
import { cors } from './middlewares/cors';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './shared/errors';

export function createApp(verify: () => Promise<void>, collections: CollectionRepository, services: ServiceRepository,
  corsOrigins: readonly string[] = []) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors(corsOrigins));
  app.use(express.json());
  app.use(healthRoutes(verify));
  app.use(collectionsRoutes(collections, services));
  app.use(servicesRoutes(services));
  app.use((_req, _res, next) => next(new NotFoundError()));
  app.use(errorHandler);
  return app;
}
