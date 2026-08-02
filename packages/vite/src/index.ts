/**
 * Tools to integrate Vite with Effect HttpServer on Node.
 *
 * ## Composition
 *
 * Create a Vite middleware-mode server via `ViteDevServer.layer(options)`,
 * provide it to your Effect app, and attach `ViteDevServer.middleware` via
 * `HttpRouter.serve` / `HttpServer.serve` so Vite's Connect stack runs before
 * Effect routes. Fallthrough (`next()`) reaches the Effect app.
 *
 * @since 0.0.0
 */
export * from "./errors.js"
export * from "./ViteDevServer.js"
