# Quickstart: withEphiAudit

## Prerequisites

- Node.js ≥ 18
- pnpm (workspace root)
- Run `pnpm install` from monorepo root

## Setup

```bash
# Install vitest in the hipaa package
pnpm --filter @pathable/hipaa add -D vitest

# Run all checks
pnpm --filter @pathable/hipaa check   # TypeScript type check
```

## Validation Scenarios

### Scenario 1: Successful operation emits attempt + succeeded logs

```bash
pnpm --filter @pathable/hipaa test -- --run
```

Expected: Test instantiates a simple `Effect.succeed(42)`, wraps it with `AuditLog.withEphiAudit`, runs it, and verifies:
- An `"attempt"` log entry was emitted
- A `"succeeded"` log entry was emitted
- The returned value is `42`

### Scenario 2: Failing operation emits attempt + failed logs

Expected: Test instantiates `Effect.fail("error")`, wraps it with `AuditLog.withEphiAudit`, runs it, and verifies:
- An `"attempt"` log entry was emitted
- A `"failed"` log entry was emitted
- The error propagates as `"error"`

### Scenario 3: Logs are not emitted until Effect runs

Expected: Test wraps an Effect with `AuditLog.withEphiAudit` but never runs it — verifies no log entries were emitted.

### Scenario 4: Multiple runs each produce independent logs

Expected: Test runs the same wrapped Effect twice and verifies two sets of attempt/succeeded log entries.

## Verification

After setup, run:
```bash
pnpm --filter @pathable/hipaa test -- --run
```

All tests should pass. TypeScript check must also pass:
```bash
pnpm --filter @pathable/hipaa check
```

## Contract References

- [Public API Contract](contracts/public-api.md) — exact type signature and behavioral guarantees
- [Data Model](data-model.md) — log entry structure and state transitions
- [Spec](spec.md) — full feature specification