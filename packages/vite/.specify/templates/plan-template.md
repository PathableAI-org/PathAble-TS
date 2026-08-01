# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (monorepo `typescript` pin) or NEEDS CLARIFICATION

**Primary Dependencies**: Effect, `@effect/platform`, Vite (and SSR plugins as needed) or NEEDS CLARIFICATION

**Storage**: N/A (library; no persistence) or NEEDS CLARIFICATION

**Testing**: Package/example typecheck + integration tests against `@effect/platform` HTTP integration / SSR build as applicable or NEEDS CLARIFICATION

**Target Platform**: Node.js (`@effect/platform` HTTP host) + browser client assets via Vite or NEEDS CLARIFICATION

**Project Type**: library (`@pathable/vite`) — Vite ↔ `@effect/platform` integration + SSR build tooling

**Performance Goals**: [domain-specific, e.g., HMR latency, SSR render p95] or NEEDS CLARIFICATION

**Constraints**: MUST compose with `@effect/platform` (HttpServer, HttpApp, HttpApi, or other fitting types); MUST NOT require a parallel non-Effect HTTP process for Vite; MUST preserve Vite as bundler; MUST keep public surface minimal or NEEDS CLARIFICATION

**Scale/Scope**: Thin Next.js-inspired layer (dev Vite integration + production SSR build/serve), not full Next.js parity or NEEDS CLARIFICATION

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (@pathable/vite v1.3.0):

- [ ] **I. Effect Platform Integration**: Design exposes Vite via `@effect/platform`
      types that fit the feature (`HttpServer`, `HttpApp`, `HttpApi`, etc.) — not a
      standalone HTTP server that bypasses the Effect request pipeline. HttpServer
      preference is allowed but not required.
- [ ] **II. Dev/Prod Parity**: Application render/route logic shares one path;
      env-specific wiring lives in package adapters.
- [ ] **III. Vite as the Build Engine**: Plan wraps Vite APIs/config/plugins; does
      not reimplement transforms, HMR, or asset graphs.
- [ ] **IV. SSR Production Builds**: If the feature touches serving or packaging,
      it includes (or explicitly defers with justification) a production SSR build
      path that fails loudly on unresolved SSR modules.
- [ ] **V. Effect Idioms & Minimal Surface**: Public APIs use Effect idioms;
      scope stays limited to `@effect/platform`↔Vite integration and SSR builds
      (YAGNI).
- [ ] **Peer dependencies**: Any `effect` / `@effect/*` package used by this
      library is declared as a `peerDependency` (optionally also
      `devDependency`) and MUST NOT appear under `dependencies`.
- [ ] **Workflow**: Changeset impact noted for public API; `example/` kept
      consistent when integration/build contracts change; `example/` remains
      version-controlled and excluded from package dist.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# DEFAULT: library package (packages/vite)
src/
├── middleware/          # `@effect/platform` ↔ Vite dev integration
├── build/               # SSR production build orchestration
├── serve/               # Production asset + SSR serve helpers
└── index.ts             # Public exports

example/                 # Living docs + manual test app (VCS only; not in dist)
                         # Extends with each feature; toward multi-page React SSR
tests/
├── integration/         # platform HTTP + Vite integration / SSR build
└── unit/
```

**Structure Decision**: Prefer the library layout above. Document any deviation
and justify against Constitution V (minimal surface).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
