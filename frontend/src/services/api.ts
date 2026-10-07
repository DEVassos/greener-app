// Cliente HTTP base: único ponto do frontend que chama fetch.

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** Erro de chamada à API, com mensagem pronta para mostrar na tela. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'O recurso pedido não foi encontrado.',
};

let readToken: () => string | null = () => null;
let onSessionExpired: () => void = () => {};

/** Ligado pelo AuthProvider: de onde vem o token e o que fazer quando a API responde 401. */
export function configureAuth(tokenReader: () => string | null, onExpired: () => void): void {
  readToken = tokenReader;
  onSessionExpired = onExpired;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === 'string' && body.message !== '') return body.message;
  } catch {
    // corpo vazio ou fora do formato JSON: usa a mensagem padrão abaixo
  }
  if (response.status >= 500) return 'O servidor encontrou um erro. Tente novamente em instantes.';
  return DEFAULT_MESSAGES[response.status] ?? `Falha na requisição (HTTP ${response.status}).`;
}

/** Faz a requisição e devolve o JSON da resposta; com sessão aberta, envia Authorization: Bearer. */
export async function apiRequest<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // Cancelamento pedido pela tela (troca de página, nova busca): repassa sem trocar a mensagem
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o backend está no ar.', 0);
  }

  // Token recusado: encerra a sessão local (o controle de acesso de verdade é do backend)
  if (response.status === 401 && token) onSessionExpired();

  if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
