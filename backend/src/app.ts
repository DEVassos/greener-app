import express from 'express';
import { healthRoutes } from './modules/health/health.routes';
import { servicesRoutes } from './modules/services/services.routes';
import { ServiceRepository } from './modules/services/services.repository';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './shared/errors';

export function createApp(verify: () => Promise<void>, services: ServiceRepository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(healthRoutes(verify));
  app.use(servicesRoutes(services));
  app.use((_req, _res, next) => next(new NotFoundError()));
  app.use(errorHandler);
  return app;
}
