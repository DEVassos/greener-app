// Os estilos globais vêm antes do App: eles declaram a ordem das camadas de CSS
// (theme, base, components, utilities) antes de qualquer componente usar uma delas.
import './styles/global.css';
import './styles/layout.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
