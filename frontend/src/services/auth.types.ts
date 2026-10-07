// Contrato provisório de POST /auth/login (US07 / BE-07).
// Ajustar quando o backend documentar a rota em docs/api.md.

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  /** JWT assinado pelo backend; enviado em Authorization: Bearer. */
  token: string;
}
