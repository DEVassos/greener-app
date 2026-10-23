import { Router, type RequestHandler } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { loginController } from './usuarios.controller';
import { UserRepository } from './usuarios.repository';
import { readToken, type AuthConfig } from './usuarios.service';

function authMiddleware(config: AuthConfig): RequestHandler {
  return (req, res, next) => {
    const header = req.get('authorization');
    if (header === undefined || !header.startsWith('Bearer ')) return next(new UnauthorizedError());
    try { res.locals.auth = readToken(header.slice('Bearer '.length), config); next(); }
    catch (error) { next(error); }
  };
}

export function authRoutes(users: UserRepository, config: AuthConfig): Router {
  const router = Router();
  router.post('/api/auth/login', loginController(users, config));
  router.get('/api/auth/me', authMiddleware(config), (_req, res) => res.status(200).json(res.locals.auth));
  return router;
}
