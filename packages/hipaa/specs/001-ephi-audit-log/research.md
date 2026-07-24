# Research: EPHI Audit Log Effect Wrapper

## Decisions

### Decision 1: Effect-TS Audit Logging Pattern

**Decision**: Use `Effect.matchEffect` to branch on success/failure + `Effect.log` / `Effect.annotateLogs` for structured audit events.

**Rationale**: `Effect.matchEffect` allows the wrapper to handle both the success and failure paths while preserving original types (`Effect<A, E, R>`). `Effect.log` integrates with the Effect logging facade (no side-effectful console calls per FR-008). `Effect.annotateLogs` can enrich log entries with structured metadata (outcome, operation context) without coupling to a specific logging backend.

**Alternatives Considered**:
- `Effect.tap` + `Effect.catchAll`: Requires two separate handlers, harder to guarantee both branches log. `matchEffect` is more explicit.
- `effect/Cause` inspection: More granular (defect vs. expected failure) but adds complexity beyond the spec's "success/fail" outcome requirement.
- Direct `console.log`: Violates FR-008 and Constitution Principle III (side effects must be deferred).

### Decision 2: vitest Configuration

**Decision**: Install `vitest` as a dev dependency in `packages/hipaa/package.json` with a `vitest.config.ts` that includes `src/` and `test/` as source roots. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.

**Rationale**: vitest is the standard test runner in the Effect-TS ecosystem, providing ESM support, TypeScript-native, and fast watch mode. A per-package config keeps the test setup self-contained within the hipaa package.

**Alternatives Considered**:
- Root-level vitest config with workspace references: Cleaner for multi-package but adds coupling between packages.
- `@effect/vitest` package: Optional enhancement for Effect-specific matchers; not required for the basic feature but good to add.

### Decision 3: No Separate AuditEvent Schema Module (Phase 1 only)

**Decision**: For this slice, audit events are emitted inline as log annotations rather than modeled as a formal Schema. The log entry for this slice is simply a string message (e.g., `"attempt"`, `"succeeded"`, `"failed"`) enriched with `Effect.annotateLogs`.

**Rationale**: The spec says "log entries will contain sufficient context" and "specific log format and severity levels are implementation details." Formalizing an `AuditEvent` Schema is a future concern when the audit infrastructure expands.

**Alternatives Considered**:
- Create a full `AuditEvent` Schema with `effect/Schema`: Pre-mature for a single-function slice. Will revisit when disclosure accounting or structured events are needed.
- Use `Effect.logInfo`, `Effect.logWarning`, `Effect.logError`: Introduces semantic levels that aren't part of the spec. Simpler log labels are sufficient.

### Decision 4: Module Naming Convention

**Decision**: Name the module file `audit-log.ts` (noun-based), importable as `import * as AuditLog from "./audit-log"`. The function is accessed as `AuditLog.withEphiAudit`.

**Rationale**: Modules named after nouns create a natural namespace for related functions. Functions as actions on that namespace read naturally in code (e.g., `AuditLog.withEphiAudit(op)`). This follows the pattern established in the user's naming convention direction.

**Alternatives Considered**:
- `with-phi-audit.ts` as module name: Verb-based module name, less discoverable for related functions as the package grows.
- Flat export from `index.ts` only: Loses namespace grouping, making it harder to organize multiple audit-related functions later.

### Decision 5: Function Location

**Decision**: Place `withEphiAudit` in `src/audit-log.ts` and re-export from `src/index.ts`.

**Rationale**: One module per public function keeps the codebase navigable as the package grows. `index.ts` serves as the public API barrel.

**Alternatives Considered**:
- Inline in `index.ts`: Clutters the entry point as the package grows.
- Single `src/audit.ts` module: Premature grouping for one function.