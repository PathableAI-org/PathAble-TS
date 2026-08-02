# Tasks: Vite Dev Middleware for Effect

**Input**: Design documents from `/specs/001-vite-dev-middleware/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in the feature specification — manual `example/` smoke + `pnpm check` / `pnpm example:check` only. No automated test tasks in this list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Library root: `packages/vite` (`src/`, `example/`, `package.json`)
- Public surface per plan: `src/ViteDev.ts`, `src/viteMiddleware.ts`, `src/errors.ts`, `src/index.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Peer dependencies and source layout for the middleware-only slice

- [x] T001 Add peerDependencies and matching devDependencies for `effect`, `@effect/platform-node`, and `vite` (Effect 4 beta line aligned with monorepo lockfile) in `packages/vite/package.json` — never under `dependencies`
- [x] T002 [P] Create source module stubs `packages/vite/src/errors.ts`, `packages/vite/src/ViteDev.ts`, and `packages/vite/src/viteMiddleware.ts` matching the plan layout
- [x] T003 [P] Update `packages/vite/example/tsconfig.json` paths/includes so the example can import `@pathable/vite` and typecheck against `@effect/platform-node` / `vite` once wired

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tagged errors and public export skeleton — MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `ViteDevStartError` and `ViteMiddlewareError` as `Schema.TaggedErrorClass` types in `packages/vite/src/errors.ts`
- [x] T005 Re-export public surface placeholders (`ViteDev`, `viteMiddleware`, errors) from `packages/vite/src/index.ts` and remove the stub `name` export once replaced
- [x] T006 Run `pnpm --filter @pathable/vite check` and fix any package config/tsconfig gaps so the new modules typecheck with peers installed

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Attach Vite Dev Middleware (Priority: P1) 🎯 MVP

**Goal**: Vite in middleware mode + custom app type, exposed as Effect `HttpMiddleware` on `@effect/platform-node`, with fallthrough to the inner Effect app

**Independent Test**: Compose `ViteDev.layer` + `viteMiddleware()` on a minimal Node Effect server; request a Vite-handled resource successfully; request a non-Vite path and observe fallthrough; confirm no second Vite HTTP listener

### Implementation for User Story 1

- [x] T007 [US1] Implement `ViteDev` `Context.Service` and `ViteDev.layer(options)` in `packages/vite/src/ViteDev.ts` — `createServer` with `appType: "custom"` and `server.middlewareMode: { server: options.server }`, acquire/release via `Layer.scoped`, map acquire failures to `ViteDevStartError`, call `vite.close()` on finalizer
- [x] T008 [US1] Define `ViteDevOptions` (required shared `node:http` `Server`, optional Vite `InlineConfig` passthrough such as `root`/`base`/`configFile`) in `packages/vite/src/ViteDev.ts`, forcing middleware-mode parent server and custom app type even if omitted by caller
- [x] T009 [US1] Implement `viteMiddleware()` in `packages/vite/src/viteMiddleware.ts` using `HttpMiddleware.make` + `Effect.async`, `NodeHttpServerRequest.toIncomingMessage` / `toServerResponse`, Connect `vite.middlewares(req, res, next)`, fallthrough to inner app on `next()`, `ViteMiddlewareError` on `next(err)`, and `HttpServerResponse.raw` sentinel when Vite writes the response
- [x] T010 [US1] Ensure public exports from `packages/vite/src/index.ts` match `specs/001-vite-dev-middleware/contracts/vite-dev-middleware.md` (`ViteDev`, `viteMiddleware`, errors, options types)
- [x] T011 [US1] Manually validate US1 against contract composition (shared `http.Server` → `NodeHttpServer.layer` + `ViteDev.layer` + `viteMiddleware`) using a throwaway or temporary entry until the example lands in US2 — document any API tweaks in `packages/vite/src/`

**Checkpoint**: User Story 1 library API is usable and independently verifiable

---

## Phase 4: User Story 2 - Minimal Example Without Client JS (Priority: P2)

**Goal**: Runnable `example/` demonstrating Vite middleware on Effect/`@effect/platform-node` with no client JS entrypoint

**Independent Test**: `pnpm --filter @pathable/vite example` starts a single-port server; curl a Vite-handled resource and `/health` (or equivalent); confirm no `entry-client` in `example/`

### Implementation for User Story 2

- [x] T012 [P] [US2] Add a smoke asset under `packages/vite/example/public/` (e.g. static file) and optional `packages/vite/example/index.html` without any client script entry
- [x] T013 [US2] Rewrite `packages/vite/example/index.ts` as an Effect/`@effect/platform-node` server: shared `createServer()`, `ViteDev.layer({ server, root: exampleDir })`, `viteMiddleware()`, trivial Effect route (e.g. `GET /health`), `NodeHttpServer.layer` + `Layer.launch` / `NodeRuntime.runMain`
- [x] T014 [US2] Point Vite example root/config at `packages/vite/example/` (inline options and/or `packages/vite/example/vite.config.ts` if needed) so middleware serves the smoke asset / Vite-managed URL
- [x] T015 [US2] Verify `packages/vite/package.json` scripts `example` and `example:check` succeed; adjust `packages/vite/example/tsconfig.json` includes as needed
- [x] T016 [US2] Confirm example layout has no client-side JS entrypoint and update `specs/001-vite-dev-middleware/quickstart.md` with the concrete port and smoke URL paths

**Checkpoint**: User Stories 1 and 2 work via the living example

---

## Phase 5: User Story 3 - Idiomatic Effect Composition (Priority: P3)

**Goal**: Clean Layer lifecycle — Vite starts with the stack and closes on scope shutdown without orphans

**Independent Test**: Start example, confirm Vite active; stop process; verify port free / no orphaned Vite; intentionally break Vite config and confirm `ViteDevStartError` fails startup

### Implementation for User Story 3

- [x] T017 [US3] Harden teardown in `packages/vite/src/ViteDev.ts` so Scope close always invokes `vite.close()` and does not leave listeners on the shared `http.Server`
- [x] T018 [US3] Ensure request-path errors in `packages/vite/src/viteMiddleware.ts` fail only the request Effect (`ViteMiddlewareError`) and never abort the listening server process
- [x] T019 [US3] Exercise startup failure path (invalid Vite root/config) from `packages/vite/example/` or a small script and confirm Layer launch fails with `ViteDevStartError` rather than a half-started “healthy” listen
- [x] T020 [US3] Document single-integration-per-server and shared-`http.Server` composition invariants in a short module comment on `packages/vite/src/index.ts` or `packages/vite/src/ViteDev.ts` (consumer-facing, matches contract)

**Checkpoint**: All three user stories independently satisfiable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Package hygiene, changeset, quickstart validation

- [x] T021 [P] Add a changeset under `.changeset/` for the new `@pathable/vite` public API (`ViteDev`, `viteMiddleware`, errors)
- [x] T022 [P] Align `packages/vite/package.json` `files`/`exports` so `example/` stays out of published dist while `dist` exports the new surface
- [x] T023 Run full validation from `specs/001-vite-dev-middleware/quickstart.md` (check, example, smoke curls, clean shutdown) and fix any gaps in `packages/vite/`
- [x] T024 Confirm `pnpm --filter @pathable/vite check` and monorepo peer install succeed after dependency adds; resolve version pins if needed in `packages/vite/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP
- **User Story 2 (Phase 4)**: Depends on US1 API (T007–T010); independently testable via example
- **User Story 3 (Phase 5)**: Depends on US1 lifecycle/middleware; validated through example shutdown/startup failure
- **Polish (Phase 6)**: Depends on desired stories being complete (ideally all three)

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2/US3
- **US2 (P2)**: Needs US1 exports to wire `example/index.ts`
- **US3 (P3)**: Hardens US1 lifecycle; uses US2 example for manual proof

### Parallel Opportunities

- T002 and T003 after T001
- T012 parallel with early US2 prep once US1 API is stable
- T021 and T022 in Polish can run in parallel

---

## Parallel Example: User Story 1

```bash
# After foundational errors/exports exist:
Task: "Implement ViteDev.layer in packages/vite/src/ViteDev.ts"
# Then (depends on ViteDev service existing for context):
Task: "Implement viteMiddleware in packages/vite/src/viteMiddleware.ts"
Task: "Align public exports in packages/vite/src/index.ts"
```

---

## Parallel Example: User Story 2

```bash
# After US1 API is exported:
Task: "Add smoke asset in packages/vite/example/public/"
# Then:
Task: "Rewrite packages/vite/example/index.ts with ViteDev + viteMiddleware"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (`ViteDev` + `viteMiddleware`)
4. **STOP and VALIDATE**: Compose against contract with a minimal server
5. Proceed to example (US2) for living docs

### Incremental Delivery

1. Setup + Foundational → peers and errors ready
2. US1 → library middleware MVP
3. US2 → runnable example without client JS
4. US3 → lifecycle/error hardening
5. Polish → changeset + quickstart sign-off

### Parallel Team Strategy

With two developers after Foundational:

- Developer A: US1 (`ViteDev.ts` / `viteMiddleware.ts`)
- Developer B: Prep US2 assets/`example/tsconfig` (T012/T003) then wire example once US1 exports land

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- No automated test tasks — spec relies on example smoke and typecheck
- Do not add SSR HTML / `ssrLoadModule` / client entry / production serve (FR-006)
- `@effect/platform-node` is an embraced peer (clarification session) — use `NodeHttpServerRequest` in `viteMiddleware.ts`
- Commit after each task or logical group
- Format validation: all tasks use `- [ ]`, Task ID, optional `[P]`/`[US#]`, and file paths
