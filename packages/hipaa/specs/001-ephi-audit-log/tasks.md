# Tasks: EPHI Audit Log Effect Wrapper

**Input**: Design documents from `specs/001-ephi-audit-log/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included — vitest setup is explicitly required by FR-007. Tests for `withEphiAudit` cover success, failure, and edge case scenarios.

**Organization**: Tasks are grouped by user story. US1 (P1) is the core audit function. US2 (P2) verifies the test runner setup.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Single library package at `packages/hipaa/`
- Source: `packages/hipaa/src/`
- Tests: `packages/hipaa/test/`
- All paths relative to `packages/hipaa/`

---

## Phase 1: Setup

**Purpose**: Install test dependencies, create vitest config, and add test scripts to package.json

- [x] T001 Install `vitest` and `@effect/vitest` as devDependencies in `packages/hipaa/package.json`
- [x] T002 [P] Create `packages/hipaa/vitest.config.ts` with TypeScript support and `src/` + `test/` include paths
- [x] T003 [P] Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `packages/hipaa/package.json`
- [x] T004 Update `packages/hipaa/tsconfig.json` to include `test/` directory for type-checking coverage

---

## Phase 2: User Story 1 - Developer wraps a PHI operation with audit logging (Priority: P1) 🎯 MVP

**Goal**: Provide a function `withEphiAudit` in the `audit-log` module that wraps any Effect with attempt/success/failure audit logging.

**Independent Test**: Call `AuditLog.withEphiAudit` on `Effect.succeed(42)`. Verify an "attempt" log entry was emitted before execution, a "succeeded" log entry was emitted after, and the returned value is `42`.

### Implementation for User Story 1

- [x] T005 [US1] Create `packages/hipaa/src/audit-log.ts` with `withEphiAudit` function that uses `Effect.matchEffect` to log attempt before execution, succeeded on success, failed on failure, preserving the original value/error
- [x] T006 [US1] Export `withEphiAudit` from `packages/hipaa/src/index.ts`
- [x] T007 [US1] Create `packages/hipaa/test/audit-log.test.ts` with tests covering:
  - Success path: Effect.succeed emits attempt + succeeded logs, returns original value
  - Failure path: Effect.fail emits attempt + failed logs, propagates original error
  - Lazy evaluation: wrapping without running emits no logs
  - Multiple runs: each execution produces independent log entries

**Checkpoint**: At this point, `AuditLog.withEphiAudit(op)` works and is testable via vitest.

---

## Phase 3: User Story 2 - Developer configures vitest for the package (Priority: P2)

**Goal**: Verify that the test suite runs correctly with a single command and discovers all test files.

**Independent Test**: Run `pnpm test` and confirm all audit-log tests pass. Run `pnpm check` and confirm TypeScript passes.

### Verification for User Story 2

- [x] T008 [US2] Run `pnpm --filter @pathable/hipaa test -- --run` and confirm all tests pass
- [x] T009 [US2] Run `pnpm --filter @pathable/hipaa check` and confirm TypeScript passes

**Checkpoint**: The package has a working test suite runnable via `pnpm test` with full TypeScript coverage.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and build validation

- [x] T010 Run `pnpm --filter @pathable/hipaa build` and confirm the package builds successfully
- [x] T011 Run quickstart.md validation scenarios to confirm all acceptance criteria are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on vitest being configured (T001-T004 from Setup)
- **User Story 2 (Phase 3)**: Depends on US1 implementation (T005-T007) and test existence
- **Polish (Phase 4)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup — vitest infrastructure must be in place for tests
- **User Story 2 (P2)**: Depends on US1 — requires test files to exist to verify runner discovery

### Parallel Opportunities

- T002 and T003 can run in parallel (vitest config and package.json scripts)
- All test cases in T007 can be written in parallel (different describe blocks)

---

## Parallel Example: Phase 2 (User Story 1)

```bash
# Task: Create audit-log.ts with withEphiAudit implementation
Task: "T005 [US1] Create src/audit-log.ts with withEphiAudit"
Task: "T006 [US1] Export from src/index.ts"
Task: "T007 [US1] Create tests in test/audit-log.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (vitest config + dev dependencies)
2. Complete Phase 2: User Story 1 (audit-log.ts + tests)
3. **STOP and VALIDATE**: `pnpm test` passes, `pnpm check` passes
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup → vitest infrastructure ready
2. Add `withEphiAudit` + tests → MVP with full audit logging (deployable!)
3. Verify test runner → Developer experience complete
4. Final polish → Build and validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently