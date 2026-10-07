import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import Brand from './Brand';
import './AppHeader.css';

interface Props {
  /** Conteúdo à direita do menu (indicador de atualização, filtros da página). */
  children?: ReactNode;
}

export default function AppHeader({ children }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="topbar-brand" aria-label="EcoPulse — ir para o dashboard">
          <Brand />
        </NavLink>

        {/* NavLink marca o link da página atual com a classe "active" e aria-current="page" */}
        <nav className="nav" aria-label="Principal">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/configuracao">Configuração</NavLink>
        </nav>

        <div className="topbar-actions">{children}</div>
      </div>
    </header>
  );
}
