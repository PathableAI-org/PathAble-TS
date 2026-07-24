# Implementation Plan: EPHI Audit Log Effect Wrapper

**Branch**: `001-ephi-audit-log` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ephi-audit-log/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Provide a `withEphiAudit` function that wraps any Effect with HIPAA-compliant audit logging: emit an "attempt" log before execution, run the operation, then emit a "success" or "failure" log. Ship the function as the first public API of the `@pathable/hipaa` package and configure vitest as the test runner.

## Technical Context

**Language/Version**: TypeScript (strict mode, extends `../../tsconfig.base.json`)

**Primary Dependencies**: `effect` (Effect-TS), `vitest` (test runner, to be added)

**Storage**: N/A — library package, no persistent storage

**Testing**: vitest with `@effect/vitest` integration for testable Effect-based assertions

**Target Platform**: Node.js ≥ 18 (ESM/CJS dual format via tsdown)

**Project Type**: Library (npm package published as `@pathable/hipaa`)

**Performance Goals**: Sub-millisecond overhead beyond underlying Effect logging infrastructure (SC-002)

**Constraints**: Must use Effect-TS idioms — `Effect`, `Layer`, etc. (Constitution Principle III). Must pass strict TypeScript checks. No `any` types. Logging through Effect system, not `console.log`. Modules named after nouns (e.g., `audit-log`) with functions as namespace actions (`AuditLog.withEphiAudit`).

**Scale/Scope**: Single public function (`withEphiAudit`) + vitest configuration. First feature in this package.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Status |
|-----------|-----------|--------|
| I. Audit-First Compliance | Feature directly implements attributable, reviewable audit logging for PHI operations. Logs attempt/success/failure lifecycle. | ✅ PASS |
| II. Strong Static Analysis | Implementation must use strict TypeScript, no `any`, exhaustive narrowing. Standard practice. | ✅ PASS |
| III. Functional Design & Patterns | Function signature follows Effect-TS conventions (`Effect<A, E, R>`). Side effects deferred to Effect system. | ✅ PASS |
| IV. PHI Awareness | Public API does not accept/return/log PHI directly — it wraps opaque operations. Log output indicates outcome, not PHI content. | ✅ PASS |
| V. Testable & Auditable | vitest will be configured; tests cover both success and failure paths per spec acceptance scenarios. | ✅ PASS |

**Gate Result**: All constitutional principles satisfied. No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-ephi-audit-log/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── checklists/          # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/hipaa/
├── src/
│   ├── index.ts              # Public API exports
│   └── audit-log.ts          # AuditLog.withEphiAudit implementation
├── test/
│   └── audit-log.test.ts     # vitest tests
├── vitest.config.ts          # vitest configuration
├── package.json              # + vitest devDependency, test script
├── tsconfig.json             # include test/
└── tsdown.config.ts          # entry: src/index.ts only
```

**Structure Decision**: Single library package within pnpm monorepo. Source in `src/`, tests in `test/`, standard Effect-TS layout.

## Complexity Tracking

N/A — no constitutional violations to justify.