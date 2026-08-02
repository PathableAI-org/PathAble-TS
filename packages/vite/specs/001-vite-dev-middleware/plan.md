# Implementation Plan: Vite Dev Middleware for Effect

**Branch**: `002-vite-dev-middleware` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-vite-dev-middleware/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Provide the most basic Vite development middleware integration for `@pathable/vite`: create a Vite server in middleware mode with custom app type, own its lifecycle via an Effect `Layer`, and expose Connect `vite.middlewares` through an `@effect/platform` / Effect HTTP middleware so all development traffic enters a single Effect HTTP server. No SSR HTML render, no client JS entrypoint, and no production build path in this slice—those are deferred deliberately as later features.

Technical approach: `ViteDev` service (`Layer.scoped` → `createServer` / `close`) + `viteMiddleware()` via `HttpMiddleware.make` bridging Node `IncomingMessage`/`ServerResponse` with `Effect.async`, requiring a shared Node `http.Server` for same-port HMR.

## Technical Context

**Language/Version**: TypeScript (monorepo `typescript` ~6.0)

**Primary Dependencies**: `effect` (4.x beta), `@effect/platform-node`, `vite` (peer); package uses Effect HTTP types from `effect/unstable/http` (HttpMiddleware, HttpServerRequest/Response) as consumed by `@effect/platform-node`

**Storage**: N/A (library; no persistence)

**Testing**: `pnpm check` / `pnpm example:check`; manual example smoke (start server, fetch Vite-handled resource, verify clean shutdown); optional integration test once deps are wired

**Target Platform**: Node.js (`@effect/platform-node` HTTP host) with Vite middleware mode (no separate Vite listen)

**Project Type**: library (`@pathable/vite`) — Vite ↔ Effect/`@effect/platform` integration (dev middleware first)

**Performance Goals**: Development HMR and module transforms remain Vite’s responsibility; integration MUST NOT add a second public HTTP listener; middleware fallthrough to Effect handlers MUST remain correct (Vite-handled vs unhandled paths)

**Constraints**: MUST compose with Effect HTTP (`HttpMiddleware` / serve pipeline); MUST NOT run Vite as a parallel HTTP process; MUST pass parent `http.Server` into `middlewareMode` for same-port HMR; MUST keep public surface minimal (service + middleware only); Effect packages are peerDependencies only

**Scale/Scope**: Thin first slice—dev Vite middleware only. Production SSR build/serve and HTML SSR handlers are out of scope (YAGNI for this feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (@pathable/vite v1.3.0):

- [x] **I. Effect Platform Integration**: Design exposes Vite via Effect HTTP middleware + scoped service composed into the Effect request pipeline—not a standalone Vite HTTP server.
- [x] **II. Dev/Prod Parity**: No application render/route logic in this slice; env-specific wiring begins with the package’s Vite-dev adapter only. Prod adapter deferred with the same future application path (see Complexity Tracking).
- [x] **III. Vite as the Build Engine**: Plan wraps `createServer` / `vite.middlewares` / `close`; does not reimplement transforms or HMR.
- [x] **IV. SSR Production Builds**: Explicitly deferred—this feature is development middleware only (FR-006). Justified in Complexity Tracking; production SSR remains a later feature per constitution roadmap.
- [x] **V. Effect Idioms & Minimal Surface**: Public API is `ViteDev` Layer + `viteMiddleware()` + tagged errors; no app framework.
- [x] **Peer dependencies**: Plan adds `effect`, `@effect/platform-node`, and `vite` as peers (and matching `devDependencies` for local example/check); none under `dependencies`.
- [x] **Workflow**: Public API introduction requires a changeset; `example/` will demonstrate middleware attachment and remain outside package `files`/`dist`.

### Post-design re-check

- [x] Contracts and data model stay within middleware + lifecycle (no SSR HTML / prod serve APIs).
- [x] Example quickstart validates single Effect entrypoint and clean shutdown (SC-002, SC-003).
- [x] HMR same-port requirement documented as a hard constraint (shared Node `http.Server`).

## Project Structure

### Documentation (this feature)

```text
specs/001-vite-dev-middleware/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/vite/
├── src/
│   ├── ViteDev.ts           # Context.Service + Layer.scoped (create/close)
│   ├── viteMiddleware.ts    # HttpMiddleware.make Connect bridge
│   ├── errors.ts            # Schema.TaggedErrorClass startup/request errors
│   └── index.ts             # Public exports
├── example/
│   ├── index.ts             # Effect HTTP server + ViteDev + viteMiddleware
│   ├── index.html           # Optional minimal HTML (no client JS entry)
│   ├── public/              # Optional static asset for smoke requests
│   └── tsconfig.json
├── tests/                   # Optional for this slice; prefer example smoke first
│   └── integration/
└── package.json             # peers: effect, @effect/platform-node, vite
```

**Structure Decision**: Library layout with a focused `src/` surface (`ViteDev`, middleware, errors). Omit `build/` and `serve/` directories until production SSR features land (Constitution V / YAGNI).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| IV. SSR Production Builds deferred | Spec scopes this as the first middleware-only step; prod SSR is a later feature | Shipping prod build/serve now would expand scope beyond “most basic first step” and block delivering the Effect middleware foundation |
| II. No shared app render path yet | No SSR/HTML app logic exists in this slice | Inventing a placeholder render path would contradict FR-006 and the no-client-entrypoint requirement |
