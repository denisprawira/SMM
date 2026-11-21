# SMM — Relay

Monorepo for **Relay**, a social media publishing tool. You pick media from Google Drive and schedule it to TikTok, Instagram, Facebook and YouTube.

```
apps/
  web/        React + Vite frontend (TanStack Router + TanStack Query + Tailwind)
  api/        (planned) backend: OAuth tokens, Drive proxy, publishing scheduler
packages/     (planned) shared code, e.g. domain types shared by web and api
```

## Getting started

Requires Node 22+ and pnpm 9.

```bash
pnpm install
pnpm dev        # starts apps/web on http://localhost:5173
pnpm build      # type-checks and builds apps/web
```

Design source: Figma file `GDPpguPRNcggn7uedypix2` (pages: Design system, Screens, States).
