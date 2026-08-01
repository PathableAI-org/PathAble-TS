<!--
  Sync Impact Report

  Version change: 1.2.0 → 1.3.0
  - MINOR: Expanded Package Scope guidance for `example/` as living docs +
    manual test project (version-controlled, never shipped in package dist;
    grows toward multi-page React SSR).

  Modified principles:
  - Package Scope (`example/` role and packaging boundary)
  - Development Workflow (example evolution expectation)

  Added sections: None
  Removed sections: None

  Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated (structure comment + gate version)
  - .specify/templates/spec-template.md ✅ No changes needed
  - .specify/templates/tasks-template.md ✅ updated (example evolution note)
  - .specify/templates/checklist-template.md ✅ No changes needed
  - Spec Kit agent skills (.cursor/skills/speckit-*) ✅ No changes needed

  Follow-up TODOs: None
-->

# @pathable/vite Constitution

## Core Principles

### I. Effect Platform Integration

This package MUST integrate Vite with `@effect/platform`. The real contract is
platform-native composition: public APIs MUST be typed with Effect constructs
(`Effect`, `Layer`, and the `@effect/platform` HTTP types that fit the feature)
so consumers compose them with their own Effect stack. Vite in development MUST
NOT run as a standalone parallel HTTP process that bypasses the Effect request
pipeline.

`HttpServer` is expected to be the module most often affected, but that is an
implementation detail—not a governance constraint. Agents and implementers MAY
extend or compose `HttpApp`, `HttpApi`, `HttpServer` middleware, or other
`@effect/platform` types whenever that is the better fit for a given feature.

Rationale: Consumers already build on `@effect/platform`. Locking the package
to a single platform type would force awkward shapes. The value is Vite inside
the Effect/platform ecosystem without a second, non-Effect HTTP process.

### II. Dev/Prod Parity

The framework MUST follow a Next.js-inspired model: application code that
renders or serves pages MUST work under Vite-backed development integration and
under a production SSR build without forked entrypoints for business logic.
Environment-specific wiring (dev Vite integration vs. production asset serving)
MUST live in package-provided adapters, not in consumer application routes.

Rationale: Divergent dev and prod paths are the primary source of SSR bugs.
Parity is a non-negotiable product constraint for a small Next.js-like layer.

### III. Vite as the Build Engine

Vite MUST remain the source of truth for module transformation, HMR, and
client/server bundling configuration. This package MUST wrap and configure Vite
APIs rather than reimplement bundling, transform pipelines, or asset graphs.
Breaking Vite contracts (config schema, plugin hooks, SSR module loading) in
public APIs is prohibited without an explicit MAJOR version bump and migration
notes.

Rationale: Vite already solves frontend tooling. This package's job is Effect
integration and SSR orchestration, not competing with Vite.

### IV. SSR Production Builds

The package MUST provide a build tool that produces a production-ready SSR
server project: server bundle, client assets, and the wiring needed to serve
them from an `@effect/platform` HTTP stack without the Vite dev integration.
Builds MUST be deterministic for a given input tree and MUST fail loudly on
unresolved SSR entry/module errors rather than silently falling back to
client-only output.

Rationale: Dev integration alone is incomplete. Production SSR is half of the
framework contract and MUST ship as a first-class, tested path.

### V. Effect Idioms & Minimal Surface

Public APIs MUST use Effect idioms (Layers, composable HTTP types, typed
errors). The framework surface MUST stay small: prefer a few composable
primitives (dev Vite integration, SSR build, production serve helpers) over a
large opinionated app framework. Features that do not serve
`@effect/platform`↔Vite integration or SSR builds MUST be deferred (YAGNI).
Side effects MUST run inside Effect; thrown exceptions at public boundaries are
design errors.

Rationale: PathAble-TS is an Effect monorepo. A thin, idiomatic layer is easier
to maintain, test, and compose than a kitchen-sink meta-framework.

## Package Scope

`@pathable/vite` is a library package that helps integrate Vite with
`@effect/platform`. In scope:

- **Dev integration**: Attach Vite's development server (HMR, transforms) to an
  Effect/platform HTTP request pipeline via the platform type(s) that fit
  (`HttpServer` middleware, `HttpApp`, `HttpApi`, etc.).
- **SSR build tool**: Produce production builds of server projects that use
  Vite SSR.
- **Production helpers**: Serve built client assets and invoke SSR render
  functions from an `@effect/platform` stack after a production build.

### Example directory (`example/`)

`example/` is a first-class, version-controlled example project used for both
documentation and manual testing. It is NOT part of the published package:

- **Docs + manual test harness**: Newcomers and maintainers run `example/` to
  see how `@pathable/vite` is meant to be consumed and to smoke-test behavior
  by hand.
- **Grows with the package**: When features are added to the library, the
  corresponding example files MUST be extended (or added) in the same change
  so the example continues to exercise the new surface.
- **Evolutionary target**: Over time `example/` SHOULD mature into a small
  multi-page SSR application using React (and related Vite SSR patterns)—not
  remain a one-file stub forever.
- **Not in distribution**: `example/` MUST remain outside the published
  package artifact (e.g. not included in `files` / dist output). It MUST stay
  in version control alongside the library source.

**Peer dependencies (NON-NEGOTIABLE)**: Every `effect` and `@effect/*` package
this library depends on MUST be declared as a `peerDependency` (and MAY also
appear in `devDependencies` for local typecheck/tests/examples). Those packages
MUST NOT be listed under `dependencies`. Consumers supply a single Effect
install; this package MUST NOT ship or nest its own copy.

Out of scope unless explicitly amended into this constitution:

- Full Next.js feature parity (file-based routing product, image CDN, ISR, etc.)
- Non-Effect HTTP frameworks as primary hosts
- Replacing Vite with another bundler

## Development Workflow

- **Type-check first**: `pnpm check` (package and monorepo) MUST pass before
  merge.
- **Lint & format**: ESLint and dprint via monorepo husky/lint-staged hooks
  are binding gates, not advisory.
- **Effect patterns**: Prefer idioms from `pnpm effect-solutions` when choosing
  Layer/HTTP/error-handling shapes.
- **Peer deps for Effect**: Adding or changing any `effect` / `@effect/*`
  dependency MUST update `peerDependencies` (and `devDependencies` if needed
  for local development)—never `dependencies`.
- **Changeset-driven**: Public API changes MUST include a changeset
  (`.changeset/`). Breaking changes to integration or build CLI contracts MUST
  be called out explicitly.
- **Example as living docs**: Changes that affect Vite/platform integration or
  SSR build MUST keep `example/` runnable (`pnpm example` /
  `pnpm example:check`) and MUST extend `example/` to demonstrate the new
  capability. `example/` MUST NOT be bundled into package distribution files.
- **Review gates**: PRs MUST state whether they touch (a) `@effect/platform`
  HTTP integration (and which types), (b) Vite config/build orchestration,
  (c) production SSR serve path, (d) Effect peer-dependency declarations,
  (e) `example/` documentation/manual-test coverage, or (f) other docs only.

## Governance

The Constitution supersedes all other practices for this package. Amendments
require a documented rationale and a PR updating
`.specify/memory/constitution.md`.

- **Amendment procedure**: Submit a PR modifying this file. Justification MUST
  reference the principle or scope boundary being changed and the consumer
  impact (platform integration, build tool, or both).
- **Versioning policy**: MAJOR for principle removals/redefinitions or
  incompatible public API governance; MINOR for new principles or materially
  expanded guidance; PATCH for wording clarifications and typo fixes.
- **Compliance review**: Specs and plans MUST pass the Constitution Check
  gates before implementation. `/speckit-converge` and PR review MUST treat
  MUST-principle violations as highest severity.

**Version**: 1.3.0 | **Ratified**: 2026-08-01 | **Last Amended**: 2026-08-01
