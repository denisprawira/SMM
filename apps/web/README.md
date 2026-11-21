# @smm/web

The Relay frontend, built from the Figma "Screens" page.

| | |
|---|---|
| Build | Vite 8, React 19, TypeScript 7 |
| Routing | TanStack Router, file-based (`src/routes`), type-safe links and search params |
| Data | TanStack Query; route loaders call `queryClient.ensureQueryData` |
| Styling | Tailwind CSS 4 with the Figma design tokens in `src/index.css` |

## Scripts

```bash
pnpm dev         # dev server with HMR (the route tree regenerates automatically)
pnpm typecheck   # tsr generate && tsc -b
pnpm build       # typecheck + production build to dist/
pnpm routes      # regenerate src/routeTree.gen.ts only
```

## Structure

```
src/
  assets/figma/        SVGs exported from Figma, imported as modules (never edited by hand)
  components/ui/       Design-system components (Button, StatusPill, Thumbnail, MetricCard, …)
  components/layout/   App shell: sidebar (≥1280px), icon rail (768–1279px), mobile header and bottom nav, Topbar
  features/<feature>/  api.ts (types, mock data, queryOptions, mutations) and the feature's page components
  lib/                 cn(), shared domain types, query client, mock transport
  routes/              __root → _app (shell layout) → pages; create/* is the full-screen Create Post flow
```

## Design tokens

Figma variables map onto Tailwind namespaces so class names read like the design:

| Figma | Class |
|---|---|
| `bg/surface`, `bg/canvas`, `bg/subtle` | `bg-surface`, `bg-canvas`, `bg-subtle` |
| `text/primary`, `text/tertiary` | `text-primary`, `text-tertiary` |
| `border/default`, `border/strong` | `border` (default), `border-strong` |
| `accent/subtle`, `danger/text` | `bg-accent-subtle`, `text-danger-text` |
| Heading/H1, Body/Small, Caption, Overline | `text-h1`, `text-body-sm`, `text-caption`, `text-overline` |
| Shadow/xs … Shadow/lg | `shadow-xs` … `shadow-lg` |

## Data

There is no backend yet. Each `features/*/api.ts` keeps an in-memory mock database and goes through `mockRequest()` (`src/lib/api.ts`). To connect the real API, swap `mockRequest` for `fetch` calls. Query keys, loaders and mutations stay the same.
