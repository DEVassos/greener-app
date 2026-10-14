import { Router } from 'express';
import { ServiceRepository } from '../services/services.repository';
import { collectionsController } from './collections.controller';
import { CollectionRepository } from './collections.repository';
export function collectionsRoutes(collections: CollectionRepository, services: ServiceRepository): Router {
  const router = Router(); router.get('/api/collections', collectionsController(collections, services)); return router;
}
