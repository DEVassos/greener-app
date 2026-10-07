# `frontend` — GreenER

Interface web (dashboard EcoPulse) que mostra a energia estimada e as emissões de CO₂e dos serviços monitorados. Stack: React + TypeScript (Vite), react-router e Tailwind CSS.

## Organização das pastas

| Pasta / arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | ponto de entrada: monta o React com o `BrowserRouter` |
| `src/App.tsx` | rotas: `/` (dashboard, público) e `/configuracao` (área restrita) |
| `src/pages/` | telas (`DashboardPage`, `SettingsPage`), cada uma com o seu `.css` |
| `src/components/` | componentes reutilizáveis (`AppHeader`, `Brand`), cada um com o seu `.css` |
| `src/styles/global.css` | tokens de cor e fonte do design system, Tailwind e reset |

## Estilos

- Os tokens de `docs/identidade-visual.md` ficam em `:root` (`src/styles/global.css`) e são a fonte única das cores.
- O Tailwind expõe os mesmos tokens como classes: `bg-surface`, `text-muted`, `border-border`, `text-primary`, `text-warning`, `text-error`, `font-display`. A paleta padrão do Tailwind (`slate-950`, `emerald-500`…) também está disponível.
- O preflight (reset) do Tailwind fica desligado para não alterar os componentes que já têm CSS próprio.

## Comandos

```bash
npm ci              # instalar dependências
npm run dev         # desenvolvimento com recarga (http://localhost:5173)
npm run typecheck   # checagem de tipos (tsc --noEmit)
npm run build       # checagem de tipos + build de produção em dist/
npm run preview     # serve o build de produção
```

## Como verificar este módulo isoladamente

1. `npm ci && npm run build` → termina sem erros de TypeScript.
2. `npm run dev` e abrir http://localhost:5173 → dashboard com o cabeçalho; o link **Configuração** abre `/configuracao`.
