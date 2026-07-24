# Contracts: withEphiAudit

> This library exports a single public function. The contract is the TypeScript type signature and its behavioral guarantees.

## Public API

```typescript
// Module: audit-log
import * as AuditLog from "./audit-log"

AuditLog.withEphiAudit<A, E, R>(op: Effect<A, E, R>): Effect<A, E, R>
```

## Contractual Guarantees

### Pre-conditions
- `op` must be a valid Effect (the function does not validate its argument).

### Post-conditions
- Returns a new Effect with the same type parameters `<A, E, R>`.
- Running the returned Effect:
  1. Emits a log entry with outcome `"attempt"` via the Effect logging system.
  2. Executes `op`.
  3. If `op` succeeds: emits a log entry with outcome `"succeeded"` and returns the original value as `Effect<A>`.
  4. If `op` fails: emits a log entry with outcome `"failed"` and fails with the original error as `Effect<never, E>`.
  5. If `op` is interrupted: the interruption propagates; no additional log is guaranteed (deferred to future iteration).

### Invariants
- The original Effect's return value and error type are preserved exactly (no wrapping, mapping, or transformation).
- No PHI content is included in log entries — only the outcome label.
- No side effects (console, file, network) occur outside the Effect system.

### Non-contract (explicitly not guaranteed)
- Log entry format, severity level, and structured metadata beyond the outcome label.
- Threading or ordering guarantees when multiple wrapped Effects run concurrently.