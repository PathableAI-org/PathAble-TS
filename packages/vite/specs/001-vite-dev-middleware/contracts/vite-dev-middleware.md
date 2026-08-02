# Contract: `@pathable/vite` Vite Dev Middleware API

**Feature**: `specs/001-vite-dev-middleware`  
**Date**: 2026-08-01  
**Status**: Design contract (pre-implementation)

## Purpose

Define the public surface consumers use to attach Vite’s development middleware to an Effect HTTP server. This is a **library API contract**, not an HTTP endpoint schema.

## Peers (consumer-provided)

| Package | Role |
|---------|------|
| `effect` | Effect runtime, Layers, Schema errors, HTTP types (`effect/unstable/http`) |
| `@effect/platform-node` | Node HTTP server + `NodeHttpServerRequest` bridge |
| `vite` | Vite development server APIs |

`effect` / `@effect/*` MUST be peerDependencies of `@pathable/vite` (not nested `dependencies`).

## Exports

### `ViteDev`

- **Kind**: `Context.Service`
- **Tag**: `@pathable/vite/ViteDev` (stable identifier)
- **Interface**:
  - `readonly server: ViteDevServer` — live Vite instance in middleware mode

### `ViteDev.layer(options: ViteDevOptions)`

- **Kind**: `Layer.Layer<ViteDev, ViteDevStartError, never>` (exact error channel may include stop defects handled in finalizer)
- **Behavior**:
  - Acquires Vite via `createServer` with `appType: "custom"` and `server.middlewareMode` bound to `options.server`
  - Releases via `vite.close()` on Scope close
  - Failures during acquire → `ViteDevStartError`
- **Does not**: call `vite.listen()`, open a second public HTTP listener, or serve SSR HTML

### `ViteDevOptions`

| Field | Required | Description |
|-------|----------|-------------|
| `server` | yes | Shared Node `http.Server` also used by `@effect/platform-node` |
| Vite config passthrough | no | e.g. `root`, `base`, `configFile`, other safe `InlineConfig` fields |

Package MUST force/override `appType: "custom"` and middleware-mode parent server even if caller omits them.

### `viteMiddleware`

- **Kind**: Effect HTTP middleware function `(httpApp) => Effect`
- **Requires**: `ViteDev` in Effect context
- **Behavior**:
  1. Try Vite Connect middleware for the current request
  2. If Vite handles the response → complete without running the inner app
  3. If Vite calls `next()` → run the inner Effect HTTP app
  4. If Vite calls `next(err)` → fail the request Effect with `ViteMiddlewareError` (server stays up)
- **Usage**: Pass as `middleware: viteMiddleware` to `HttpRouter.serve` / `HttpServer.serve`

### Errors

| Error | When |
|-------|------|
| `ViteDevStartError` | Vite fails to start during Layer acquire |
| `ViteMiddlewareError` | Per-request Connect/Vite failure |

Both are Schema tagged errors suitable for Effect error channels.

## Composition contract (consumer wiring)

```text
shared node:http.Server
        │
        ├──────────────► NodeHttpServer.layer(() => server, { port })
        │
        └──────────────► ViteDev.layer({ server, ... })
                                │
HttpRouter/HttpServer.serve(app, { middleware: viteMiddleware })
                                │
                         Layer.provide(ViteDev…)
                         Layer.provide(NodeHttpServer…)
```

**Invariants**:

1. One shared Node `http.Server` instance for Effect listen + Vite middleware mode
2. Vite middleware runs before consumer catch-all / page handlers
3. No parallel `vite` CLI dev server process for the same app
4. Single ViteDev integration per server (double registration undefined)

## Non-goals (not part of this contract)

- `transformIndexHtml` + SSR `render` HTML pipeline
- `ssrLoadModule` / entry-server helpers
- Client entry / hydration helpers
- Production static file serving or SSR build CLI

## Compatibility notes

- Target Effect 4 beta line used by PathAble-TS
- Node.js host only for this slice (`@effect/platform-node`)
