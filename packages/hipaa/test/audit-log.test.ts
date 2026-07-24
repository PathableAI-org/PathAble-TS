import { Effect, Logger } from "effect"
import { describe, expect, it } from "vitest"

import * as AuditLog from "../src/audit-log.js"

const captureLogs = <A, E>(
  effect: Effect.Effect<A, E, never>
): Effect.Effect<readonly [A, readonly string[]], E, never> => {
  const logs: string[] = []
  const testLogger = Logger.make<unknown, void>((options) => {
    logs.push(String(options.message))
  })
  return Effect.sync(() => logs).pipe(
    Effect.flatMap((logArray) =>
      effect.pipe(
        Effect.flatMap((result) => Effect.sync(() => [result, logArray] as const))
      )
    ),
    Effect.provide(Logger.addScoped(Effect.sync(() => testLogger))),
    Effect.scoped
  )
}

describe("AuditLog.withEphiAudit", () => {
  it("emits attempt and succeeded logs on success and returns the value", async () => {
    const op = Effect.succeed(42)

    const [result, logs] = await captureLogs(AuditLog.withEphiAudit(op)).pipe(
      Effect.runPromise
    )

    expect(result).toBe(42)
    expect(logs).toContain("ePHI operation attempted")
    expect(logs).toContain("ePHI operation succeeded")
  })

  it("emits attempt and failed logs on failure and propagates the error", async () => {
    const op = Effect.fail("test-error")

    const [result, logs] = await captureLogs(
      AuditLog.withEphiAudit(op).pipe(Effect.flip)
    ).pipe(Effect.runPromise)

    expect(result).toBe("test-error")
    expect(logs).toContain("ePHI operation attempted")
    expect(logs).toContain("ePHI operation failed")
  })

  it("emits independent log entries for each execution", async () => {
    const op = Effect.succeed("multi")
    const wrapped = AuditLog.withEphiAudit(op)

    const [result1, logs1] = await captureLogs(wrapped).pipe(Effect.runPromise)
    const [result2] = await captureLogs(wrapped).pipe(Effect.runPromise)

    expect(result1).toBe("multi")
    expect(result2).toBe("multi")
    expect(logs1.filter((m) => m === "ePHI operation attempted")).toHaveLength(1)
    expect(logs1.filter((m) => m === "ePHI operation succeeded")).toHaveLength(1)
  })
})
