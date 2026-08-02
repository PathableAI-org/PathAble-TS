/**
 * Typed errors for Vite development integration.
 *
 * @since 0.0.0
 */
import { Schema } from "effect"

/**
 * Raised when the Vite development server fails to start during Layer acquire.
 *
 * @since 0.0.0
 */
export class ViteDevStartError extends Schema.TaggedErrorClass<ViteDevStartError>()("ViteDevStartError", {
  cause: Schema.optional(Schema.Defect())
}) {}

/**
 * Raised when Connect/Vite middleware fails for a single request.
 *
 * @since 0.0.0
 */
export class ViteMiddlewareError extends Schema.TaggedErrorClass<ViteMiddlewareError>()("ViteMiddlewareError", {
  cause: Schema.optional(Schema.Defect())
}) {}
