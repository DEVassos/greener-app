import { compare } from 'bcryptjs';
import { sign, verify, type SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors';
import { UserRepository } from './usuarios.repository';

export interface AuthConfig { jwtSecret: string; jwtExpiresIn: NonNullable<SignOptions['expiresIn']> }
export interface AuthenticatedUser { id: string; email: string }

export async function login(users: UserRepository, email: string, password: string, config: AuthConfig): Promise<string> {
  const user = await users.findByEmail(email);
  if (user === null || !await compare(password, user.password_hash)) throw new UnauthorizedError();
  return sign({ email: user.email }, config.jwtSecret, { subject: user.id, expiresIn: config.jwtExpiresIn });
}

export function readToken(token: string, config: AuthConfig): AuthenticatedUser {
  try {
    const payload = verify(token, config.jwtSecret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.email !== 'string') throw new Error('Payload invalido');
    return { id: payload.sub, email: payload.email };
  } catch {
    throw new UnauthorizedError();
  }
}
