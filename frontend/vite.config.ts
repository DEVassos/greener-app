import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// SPA: uma única entrada (index.html); as telas são rotas do react-router
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
