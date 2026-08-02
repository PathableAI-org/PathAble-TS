# Data Model: Vite Dev Middleware for Effect

**Feature**: `specs/001-vite-dev-middleware`  
**Date**: 2026-08-01

This feature has no persisted domain data. The “model” is the runtime entities owned by the package and how they relate in the Effect stack.

## Entities

### ViteDev Integration

| Field | Description |
|-------|-------------|
| `server` | The live Vite development server instance (middleware mode, custom app type) |
| `options.server` | Shared Node `http.Server` used for middleware-mode HMR on the Effect host |
| `options` (config) | Passthrough Vite inline config / root / config file discovery inputs |

**Relationships**:

- Provided to the Effect context as a service for the lifetime of the owning Scope
- Consumed by `viteMiddleware` on each request
- Closed when the Scope finalizer runs

**Validation / invariants**:

- MUST be created with `appType: "custom"`
- MUST use middleware mode with the shared parent `http.Server` (not a standalone Vite listen)
- At most one integration per Effect HTTP server is supported (documented; double attach undefined)
- Startup failure MUST prevent a “healthy” server Layer from launching

### Effect HTTP Pipeline

| Field | Description |
|-------|-------------|
| Middleware chain | Ordered transformers around the Effect HTTP app |
| Inner app | Consumer routes / handlers after Vite fallthrough |

**Relationships**:

- Vite middleware is outermost (or otherwise first) relative to app catch-all handlers
- Vite-handled requests end in the Node response without invoking the inner app
- Unhandled requests call Connect `next` and continue to the inner Effect app

**Validation / invariants**:

- All public HTTP traffic enters via the Effect-hosted Node server
- Request-time Vite failures affect only that request

### Example App

| Field | Description |
|-------|-------------|
| Effect server entry | Runnable example process |
| Smoke resource | At least one Vite-handled URL used for manual verification |
| Client JS entry | Absent for this feature |

**Relationships**:

- Depends on `ViteDev` Layer + `viteMiddleware` + Node HTTP Layer
- Lives under `example/`; not published in package dist

## State transitions

### ViteDev lifecycle

```text
[Absent]
   │ Layer acquire (createServer)
   ▼
[Running] ──request──► middleware try Vite ──handled──► [Response written]
   │                         │
   │                         └──next()──► inner Effect app
   │ Scope close (vite.close)
   ▼
[Closed]
```

### Error states

| State | Trigger | Outcome |
|-------|---------|---------|
| Start failed | `createServer` throws / rejects | Layer fails with `ViteDevStartError`; no listen as “ready” |
| Request failed | Connect `next(err)` / transform error | `ViteMiddlewareError` for that request; server stays up |
| Stop | Scope finalizer | `vite.close()`; no orphaned Vite process on example port |

## Out of model (deferred)

- SSR render results / HTML templates
- Client hydration bundles
- Production asset manifests / SSR build outputs
