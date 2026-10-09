/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço base da API do backend, por exemplo http://localhost:3000. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
