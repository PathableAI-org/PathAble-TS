# Quickstart: Validate Vite Dev Middleware

**Feature**: `specs/001-vite-dev-middleware`  
**Date**: 2026-08-01

Manual validation guide for the middleware-only slice. See [contracts/vite-dev-middleware.md](./contracts/vite-dev-middleware.md) for the API surface and [data-model.md](./data-model.md) for lifecycle expectations.

## Prerequisites

- PathAble-TS monorepo with `pnpm` available
- On branch `002-vite-dev-middleware` (or equivalent with this feature implemented)
- Package peers installed: `effect`, `@effect/platform-node`, `vite`

## Setup

From the monorepo root:

```bash
pnpm install
pnpm --filter @pathable/vite check
pnpm --filter @pathable/vite example:check
```

## Run the example

```bash
pnpm --filter @pathable/vite example
```

Expected:

- Logs show listening on `http://localhost:5173` (override with `PORT`)
- Single Effect/`@effect/platform-node` listener (no separate Vite URL / second port)
- Process stays up until interrupted

## Smoke checks

### 1. Vite-handled resource (P1 / SC-001 / SC-002)

```bash
curl -i "http://localhost:5173/hello.txt"
```

Expected: HTTP 200 with body `ok` (from `example/public/hello.txt` via Vite middleware).

### 2. Effect fallthrough (P1)

```bash
curl -i "http://localhost:5173/health"
```

Expected: HTTP 200 with body `ok` from the Effect route.

### 3. No client JS entry required (P2 / SC-004)

Inspect `packages/vite/example/`:

- No `entry-client` / client JS entrypoint
- Optional `index.html` has no client `<script type="module">`

### 4. Clean shutdown (P3 / SC-003)

Stop the example (Ctrl+C). Verify the port is free (e.g. `curl` fails / port can bind again).

### 5. Startup failure (edge / FR-007)

Point `ViteDev.layer` at an invalid `root` (or break Vite config) and start again. Expected: process fails during Layer acquire with `ViteDevStartError`, not a hung healthy listen.

## Success mapping

| Success criterion | How this quickstart covers it |
|-------------------|-------------------------------|
| SC-001 | Smoke check 1 within ~30s of documented run |
| SC-002 | Single port / no second Vite listener in run + check 1 |
| SC-003 | Smoke check 4 |
| SC-004 | Smoke check 3 |
| SC-005 | Example wiring matches [contracts](./contracts/vite-dev-middleware.md) |
| SC-006 | `package.json` peers include `@effect/platform-node`, `effect`, `vite` |

## Out of scope for this quickstart

- SSR HTML rendering / `ssrLoadModule`
- Production build + preview
- Client hydration / HMR UI demos beyond confirming middleware serves Vite resources
