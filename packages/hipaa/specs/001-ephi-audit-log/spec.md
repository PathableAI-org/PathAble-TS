# Feature Specification: EPHI Audit Log Effect Wrapper

**Feature Branch**: `001-ephi-audit-log`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Provide a function that wraps an Effect with HIPAA audit logging. The function, called withEphiAudit, emits a log before the operation, runs the operation, then logs success or failure. It should have type <A, E, R>(op: Effect<A, E, R>) => Effect<A, E, R>. This also sets up vitest within the package."

## Clarifications

### Session 2026-07-24

- Q: Module naming convention? → A: Modules named after nouns — "audit-log" so it can be imported as `import * as AuditLog from "./audit-log"` and functions are actions on the module: `AuditLog.withEphiAudit`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer wraps a PHI operation with audit logging (Priority: P1)

A developer working with ePHI (electronic Protected Health Information) needs to ensure that every access to PHI is auditable per HIPAA Security Rule 45 CFR 164.312(b). The developer wraps an existing Effect-based operation with `AuditLog.withEphiAudit` and gets audit-log lifecycle events emitted automatically.

**Why this priority**: This is the core value of the feature — without this, there is no audit logging.

**Independent Test**: Can be fully tested by calling `AuditLog.withEphiAudit` on a simple Effect that returns a known value, then verifying that a pre-operation log entry and a success log entry were emitted. Delivers auditable PHI access tracking.

**Acceptance Scenarios**:

1. **Given** a developer has an Effect that returns a known value, **When** they wrap it with `AuditLog.withEphiAudit` and run the resulting Effect, **Then** a log entry is emitted before the operation executes and a success log entry is emitted after the operation completes.

2. **Given** a developer has an Effect that fails with a known error, **When** they wrap it with `AuditLog.withEphiAudit` and run the resulting Effect, **Then** a log entry is emitted before the operation executes and a failure log entry is emitted after the operation fails.

3. **Given** a developer wraps an Effect with `AuditLog.withEphiAudit`, **When** the wrapped Effect runs successfully, **Then** the original return value is preserved and returned to the caller unchanged.

---

### User Story 2 - Developer configures vitest for the package (Priority: P2)

A developer wants to run tests for the HIPAA package using vitest, enabling automated verification of audit logging behavior.

**Why this priority**: Testing is essential for compliance verification, but the audit wrapper function itself can be tested manually or via other means in a pinch.

**Independent Test**: Can be fully tested by installing vitest, adding a test configuration file, and running a simple smoke test that passes. Delivers a working test harness for the package.

**Acceptance Scenarios**:

1. **Given** vitest is installed as a dev dependency, **When** the developer runs `pnpm test` or the equivalent test command, **Then** tests execute and report pass/fail results.

2. **Given** a test file exists for `withEphiAudit`, **When** the developer runs tests, **Then** the test runner discovers and executes the test file.

---

### Edge Cases

- What happens when the wrapped Effect is never run (lazy evaluation)? No audit log entries should be emitted until the Effect is actually executed.
- What happens when the same Effect is run multiple times? Each execution should produce its own independent set of audit log entries.
- How does the system handle the operation being interrupted or cancelled (e.g., via Effect interruption)? The system should log the interruption as a failure outcome.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a function named `withEphiAudit` within an `audit-log` module, importable as `import * as AuditLog from "./audit-log"`, that accepts any Effect and returns an Effect of the same type signature.
- **FR-002**: Before executing the wrapped operation, the system MUST emit a log entry indicating the operation is being attempted.
- **FR-003**: After successful execution of the wrapped operation, the system MUST emit a log entry indicating the operation succeeded.
- **FR-004**: After failed execution of the wrapped operation, the system MUST emit a log entry indicating the operation failed.
- **FR-005**: The original return value of the wrapped operation MUST be preserved and returned unchanged through the audit wrapper.
- **FR-006**: The original error of the wrapped operation MUST be preserved and propagated unchanged through the audit wrapper.
- **FR-007**: The system MUST include a test runner configuration (vitest) that can discover and execute tests.
- **FR-008**: Log entries MUST be emitted through the Effect-TS logging system, not through side-effectful console calls.

### Key Entities *(include if feature involves data)*

- **AuditEvent**: A record of an operation's lifecycle within the audit system. Contains at minimum an outcome (attempted, succeeded, failed) and is associated with a specific operation.
- **AuditLog**: The mechanism through which audit events are emitted. Decoupled from the specific logging backend to allow different transports (stdout, files, external services).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can wrap any Effect with `withEphiAudit` and receive a new Effect of the same type in under 5 minutes of reading documentation.
- **SC-002**: The audit wrapper introduces no measurable overhead (sub-millisecond) beyond the underlying Effect-TS logging infrastructure.
- **SC-003**: The audit wrapper correctly emits log entries for all three outcomes (attempt, success, failure) as verified by automated tests.
- **SC-004**: The package's test suite can be run with a single command (`pnpm test` or equivalent) and successfully executes all defined tests.

## Assumptions

- The target programming language is TypeScript with the Effect-TS library.
- Log entries are emitted via Effect's built-in logging facade (`Effect.log`, `Effect.annotateLogs`, or similar).
- The test framework is vitest, configured as a dev dependency and runnable via package.json scripts.
- The function signature follows Effect-TS conventions: `<A, E, R>(op: Effect<A, E, R>) => Effect<A, E, R>`.
- The log entries will contain sufficient context (attempt vs. success vs. failure) but the specific log format and severity levels are implementation details.
- The package is part of a pnpm monorepo and follows existing conventions for package.json scripts and TypeScript configuration.
- Modules are named after nouns (e.g., `audit-log`) and imported as namespace objects: `import * as AuditLog from "./audit-log"`, with functions as actions on that namespace: `AuditLog.withEphiAudit`.