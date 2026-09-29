# EarlySignal AI

EarlySignal AI is a demo-only early-warning dashboard that helps small e-commerce businesses review prepared changes before deciding what deserves attention.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/earlysignal-ai/src/lib/demo-data.ts` — centralized demo monitors, changes, analyses, derived selectors, and frontend state.
- `artifacts/earlysignal-ai/src/components/earlysignal-shell.tsx` — shared navigation shell, badges, page headers, and empty states.
- `artifacts/earlysignal-ai/src/pages/earlysignal-pages.tsx` — landing, dashboard, monitor, alert, change detail, settings, and fallback pages.
- `artifacts/earlysignal-ai/src/index.css` — app theme, responsive layout, component styling, focus states, and motion.

## Architecture decisions

- The first MVP is intentionally frontend-only; prepared demo data is kept in a provider so the UI can later swap to API-backed repositories without duplicating entity shapes.
- Demo signals, source URLs, and AI explanations are explicitly labeled throughout the experience to avoid implying live monitoring or real-world analysis.
- Monitor creation and pause/resume are local state interactions only; no external pages are fetched.

## Product

The app lets users move from a landing page into a dashboard, review prepared monitor signals, create a demo monitor, inspect change history, open a change, and read cautious Demo AI Analysis. Alerts and settings make the demo workspace feel complete while clearly stating its limitations.

## User preferences

- Keep the product clearly framed as demo data until live monitoring, authentication, notifications, and AI services are explicitly added.

## Gotchas

- The frontend artifact workflow provides `PORT` and `BASE_PATH`; direct production builds need both values set in the shell.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
