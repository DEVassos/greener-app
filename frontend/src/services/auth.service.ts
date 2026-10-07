import { ApiError, apiRequest } from './api';
import type { LoginRequest, LoginResponse } from './auth.types';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    return await apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: credentials });
  } catch (error) {
    // No login, 401 significa credencial errada, não sessão expirada
    if (error instanceof ApiError && error.status === 401) throw new ApiError('E-mail ou senha incorretos.', 401);
    throw error;
  }
}
