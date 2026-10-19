import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// SPA: uma única entrada (index.html); as telas são rotas do react-router
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // As variáveis VITE_* vêm do .env da raiz do repositório (modelo em .env.example)
  envDir: '..',
  server: { port: 5173 },
});
