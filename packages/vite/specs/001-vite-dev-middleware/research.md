# Research: Vite Dev Middleware for Effect

**Feature**: `specs/001-vite-dev-middleware`  
**Date**: 2026-08-01  
**References**: [Vite SSR guide](https://vite.dev/guide/ssr), [`template-ssr-vanilla`](https://github.com/bluwy/create-vite-extra/tree/master/template-ssr-vanilla), Effect 4 HTTP (`effect/unstable/http`), `@effect/platform-node`

## Decision summary

| Topic | Decision |
|-------|----------|
| Vite setup | `createServer({ server: { middlewareMode: { server } }, appType: "custom" })` |
| Lifecycle | `ViteDev` `Context.Service` + `Layer.scoped` (`createServer` / `vite.close()`) |
| HTTP bridge | `HttpMiddleware.make` + `Effect.async` around Connect `(req, res, next)` |
| Node access | `NodeHttpServerRequest.toIncomingMessage` / `toServerResponse` |
| Public API | Both: `ViteDev.layer(...)` and `viteMiddleware()` |
| Parent server | Consumer (or example) creates one `node:http` `Server` shared by NodeHttpServer + ViteDev |
| Out of scope | SSR HTML handler, `ssrLoadModule`, client entry, production serve |

---

## R1. How to attach Connect middleware to Effect HTTP

**Decision**: Implement `viteMiddleware()` with `HttpMiddleware.make`. For each request, extract Node `IncomingMessage`/`ServerResponse`, invoke `vite.middlewares(req, res, next)` inside `Effect.async`. On Connect `next()`, resume the inner Effect app (fallthrough). If Vite writes the response (`res` finishes without `next`), return a sentinel `HttpServerResponse` and rely on `@effect/platform-node` skipping a second write when `writableEnded` is true.

**Rationale**: Effect 4 has no built-in Connect adapter; community Effect+Vite guidance uses this exact bridge. It preserves Vite-first ordering matching Express `app.use(vite.middlewares)`.

**Alternatives considered**:

- Mount Effect inside Vite `configureServer` — inverted architecture; violates constitution (Vite must not own the primary HTTP process).
- Wrap Node server imperatively before `HttpServer.serve` — bypasses Effect middleware composition and typed errors.
- Convert every request to Web `Request`/`Response` — extra translation; Vite is Connect-native on Node.

---

## R2. Vite configuration for middleware mode

**Decision**: Always set `appType: "custom"` and `server.middlewareMode: { server: parentHttpServer }`. Do not call `vite.listen()` or `vite.printUrls()`. Boolean `middlewareMode: true` without a parent server is unsupported because it opens a separate HMR websocket port (breaks single-entrypoint success criteria).

**Rationale**: Matches Vite SSR guide + `template-ssr-vanilla` middleware portion; parent server keeps HMR on the same port as the Effect HTTP server (SC-002).

**Alternatives considered**:

- Separate HMR port (`server.ws.port`) — simpler listener isolation, but a second public listener fails SC-002.
- Let Vite listen and reverse-proxy — parallel HTTP process; constitution violation.

---

## R3. Public API shape

**Decision**: Export:

1. `ViteDev` — `Context.Service` exposing `{ readonly server: ViteDevServer }`
2. `ViteDev.layer(options)` — scoped Layer; options include `server: Http.Server` and Vite `InlineConfig` passthrough (`root`, `configFile`, etc.)
3. `viteMiddleware()` — `HttpMiddleware` requiring `ViteDev` in context
4. Tagged errors — `ViteDevStartError`, `ViteMiddlewareError` (and soft-fail/log on stop if needed)

**Rationale**: Separates lifecycle (Layer) from request path (middleware), matches `effect-solutions` services-and-layers guidance, and keeps composition with `HttpRouter.serve(..., { middleware })` / `HttpServer.serve` explicit.

**Alternatives considered**:

- Layer-only API that hides middleware registration — obscures ordering and hurts composition with other middleware.
- Export raw `ViteDevServer` without a service tag — harder to test and non-idiomatic.

---

## R4. Lifecycle and teardown

**Decision**: `Layer.scoped` acquires via `Effect.tryPromise` → `createServer(...)`, registers `Effect.addFinalizer` → `server.close()`. Startup failures become `ViteDevStartError` failing Layer launch (FR-007). Request-time Connect errors resume `Effect.fail(ViteMiddlewareError)` for that request only (FR-008). Scope close closes Vite (FR-009).

**Rationale**: Effect Scope is the idiomatic resource boundary; mirrors how other Effect platform services manage listeners and clients.

**Alternatives considered**: Manual `acquireRelease` in the example only — would push lifecycle onto consumers and fight Effect idioms (FR-003).

---

## R5. Shared Node `http.Server` bootstrap

**Decision**: Require consumers to create `createServer()` once and pass it to both `NodeHttpServer.layer(() => server, { port })` and `ViteDev.layer({ server, ... })`. Document this in contracts and quickstart. A future convenience Layer may bundle this, but is YAGNI for v1.

**Rationale**: Vite needs the parent server for middleware-mode HMR; Effect Node HTTP also needs the same instance. Extracting the raw Node server from the `HttpServer` service after listen is not a stable public path for v1.

**Alternatives considered**: Convenience mega-layer only — nicer DX but hides the shared-server constraint; can land later without changing the core contract.

---

## R6. HMR / upgrade coexistence

**Decision**: Create Vite before serving Effect HTTP so Vite’s selective `upgrade` listener (vite-hmr / vite-ping) is registered on the shared server. Document that reverse proxies must forward WebSockets. Validate in example smoke that no second port is opened. If Effect’s upgrade handler conflicts empirically, follow up with a skip/no-op for Vite HMR protocols (may need platform contribution)—not a blocker for middleware asset serving in this slice.

**Rationale**: Vite docs require parent `server` for same-port HMR; listener order is the lowest-cost first mitigation.

**Alternatives considered**: Disable HMR for v1 — weaker verification of middleware mode correctness; rejected as default.

---

## R7. Example without client JS entry

**Decision**: Example is an Effect HTTP server that provides `ViteDev` + `viteMiddleware`, exposes a trivial Effect route (e.g. `/health`), and relies on Vite for at least one development resource (e.g. `/@vite/client` or a file under `public/` / a simple module URL). No `entry-client.js`, no hydration, no `ssrLoadModule` HTML pipeline.

**Rationale**: Satisfies FR-005 / SC-004 while still proving FR-001–FR-002.

**Alternatives considered**: Full vanilla SSR template copy — includes client entry and SSR HTML handler; out of scope (FR-006).

---

## R8. Dependencies and import surface

**Decision**: Peer (+ local dev) dependencies: `effect`, `@effect/platform-node`, `vite`. Use Effect 4 HTTP imports consistent with `@effect/platform-node` (e.g. `effect/unstable/http` for middleware types). Align versions with monorepo lockfile (Effect 4.0.0-beta line).

**Rationale**: Constitution peer-deps rule; Node-specific bridge lives in `@effect/platform-node`.

**Alternatives considered**: Depend on a separate `@effect/platform` package only — Effect 4 Node stack is driven by `effect` + `@effect/platform-node` in this monorepo’s lockfile.

---

## Open items resolved for planning

| Former unknown | Resolution |
|----------------|------------|
| Connect → Effect bridge | `HttpMiddleware.make` + `Effect.async` (R1) |
| Layer vs middleware | Both (R3) |
| Same-port HMR | Parent server in `middlewareMode` (R2, R5) |
| Prod SSR in this feature? | Deferred with constitution Complexity Tracking |
| Client entry in example? | Not required (R7) |

Remaining implementation risks (not blocking plan): empirical upgrade-handler interaction; exact Vite version range pin during dependency add.
