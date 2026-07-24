import { Effect } from "effect"

export const withEphiAudit = <A, E, R>(op: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.log("ePHI operation attempted").pipe(
    Effect.flatMap(() => op),
    Effect.tapBoth({
      onFailure: () => Effect.log("ePHI operation failed"),
      onSuccess: () => Effect.log("ePHI operation succeeded")
    })
  )
