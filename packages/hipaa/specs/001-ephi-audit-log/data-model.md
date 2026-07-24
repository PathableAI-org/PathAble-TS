# Data Model: withEphiAudit

> This feature introduces no persistent data model. The audit log entries are transient log messages emitted through the Effect logging facade. See [plan.md](plan.md) for the rationale (Decision 3 in research).

## Audit Event Structure (Transient/Log-Only)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| outcome | `"attempt" \| "succeeded" \| "failed"` | The lifecycle phase being logged | `"succeeded"` |
| message | `string` | Human-readable description of the event | `"ePHI operation completed successfully"` |

## State Transitions

```text
(op) ──→ AuditLog.withEphiAudit(op)
            │
            ├── emit "attempt" log
            │
            ├── run op
            │   │
            │   ├── op succeeds → emit "succeeded" log → return A
            │   │
            │   └── op fails → emit "failed" log → fail with E
            │
            └── (never run) → no logs emitted
```

## Validation Rules

- No logs are emitted until the returned Effect is actually executed (lazy evaluation).
- Each execution of the returned Effect produces its own set of three log entries (attempt, then succeeded/failed).
- The original Effect's value (A) or error (E) must pass through unchanged — the wrapper must not transform, wrap, or intercept the result.