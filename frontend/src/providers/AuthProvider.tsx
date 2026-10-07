import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { configureAuth } from '../services/api';
import * as authService from '../services/auth.service';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextValue, AuthUser } from '../contexts/AuthContext';

// O token fica no sessionStorage: some ao fechar a aba e não é compartilhado entre abas (US07)
const STORAGE_KEY = 'greener.session';

interface Session {
  token: string;
  user: AuthUser;
}

function readSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null; // armazenamento bloqueado ou conteúdo inválido: segue como visitante
  }
}

function writeSession(session: Session | null): void {
  try {
    if (session) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sem armazenamento: a sessão vale só enquanto a página estiver aberta (fica no estado)
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(readSession);

  // O cliente HTTP lê o token por esta referência, sempre com o valor atual
  const tokenRef = useRef<string | null>(session?.token ?? null);
  useEffect(() => {
    tokenRef.current = session?.token ?? null;
  }, [session]);

  const logout = useCallback(() => {
    writeSession(null);
    tokenRef.current = null;
    setSession(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await authService.login({ email, password });
    const next: Session = { token, user: { email, name: email.split('@')[0] } };
    writeSession(next);
    tokenRef.current = token;
    setSession(next);
  }, []);

  useEffect(() => {
    configureAuth(
      () => tokenRef.current,
      () => {
        logout();
        navigate('/login', { replace: true });
      },
    );
  }, [logout, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
