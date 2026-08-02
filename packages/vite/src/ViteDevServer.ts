import * as NodeHttpServerRequest from "@effect/platform-node/NodeHttpServerRequest"
import { Context, Effect, Layer } from "effect"
import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import * as vite from "vite"

import { ViteDevStartError, ViteMiddlewareError } from "./errors.js"

export type ServerOptions = Parameters<typeof vite.createServer>[0]

export interface Vite {
  /**
   * Runs Vite's Connect stack, then falls through to the inner Effect app.
   * Pass to `HttpRouter.serve(..., { middleware })`.
   */
  readonly middleware: ViteMiddleware
  readonly ssrLoadModule: (
    url: string,
    options?: {
      fixStacktrace?: boolean
    }
  ) => Effect.Effect<Record<string, unknown>, never>
  readonly transformIndexHtml: (
    url: string,
    template: string,
    originalUrl?: string
  ) => Effect.Effect<string, never>
}

/**
 * Middleware shape accepted by `HttpRouter.serve(..., { middleware })`.
 *
 * More precise than `HttpMiddleware.HttpMiddleware` (which widens to `any`),
 * while remaining assignable to that option.
 */
export type ViteMiddleware = <E, R>(
  httpApp: Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    E,
    HttpServerRequest.HttpServerRequest | R
  >
) => Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  E | ViteMiddlewareError,
  HttpServerRequest.HttpServerRequest | R
>

const transformIndexHtml = (server: vite.ViteDevServer): Vite["transformIndexHtml"] =>
(
  url: string,
  template: string,
  originalUrl?: string
) => Effect.promise(() => server.transformIndexHtml(url, template, originalUrl))

const ssrLoadModule = (server: vite.ViteDevServer): Vite["ssrLoadModule"] =>
(
  url: string,
  options?: {
    fixStacktrace?: boolean
  }
) => Effect.promise(() => server.ssrLoadModule(url, options))

const makeMiddleware = (server: vite.ViteDevServer): ViteMiddleware =>
  HttpMiddleware.make(<E, R>(
    httpApp: Effect.Effect<
      HttpServerResponse.HttpServerResponse,
      E,
      HttpServerRequest.HttpServerRequest | R
    >
  ): Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    E | ViteMiddlewareError,
    HttpServerRequest.HttpServerRequest | R
  > =>
    Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest
      const req = NodeHttpServerRequest.toIncomingMessage(request)
      const res = NodeHttpServerRequest.toServerResponse(request)

      return yield* Effect.callback<
        HttpServerResponse.HttpServerResponse,
        E | ViteMiddlewareError,
        HttpServerRequest.HttpServerRequest | R
      >((resume) => {
        const onFinish = () => {
          resume(
            Effect.succeed(
              HttpServerResponse.raw(null, {
                status: res.statusCode,
                ...(res.statusMessage !== undefined ? { statusText: res.statusMessage } : {})
              })
            )
          )
        }

        res.once("finish", onFinish)

        const next = (err?: unknown) => {
          res.off("finish", onFinish)
          if (err !== undefined && err !== null) {
            return resume(new ViteMiddlewareError({ cause: err }))
          }
          return resume(httpApp)
        }

        server.middlewares(req, res, next)
      })
    })
  )

const fromVite = (server: vite.ViteDevServer): Vite => ({
  middleware: makeMiddleware(server),
  ssrLoadModule: ssrLoadModule(server),
  transformIndexHtml: transformIndexHtml(server)
})

export class ViteDevServer extends Context.Service<ViteDevServer, Vite>()("@pathable/vite/Server") {}

export const make = (
  options: ServerOptions
): Effect.Effect<ViteDevServer["Service"], ViteDevStartError> =>
  Effect.tryPromise({
    catch: (cause) => new ViteDevStartError({ cause }),
    try: () => vite.createServer(options)
  }).pipe(
    Effect.map((server) => fromVite(server))
  )

export const layer = (
  options: ServerOptions
) => Layer.effect(ViteDevServer, make(options))

/**
 * Middleware for `HttpRouter.serve` when `ViteDevServer` is provided via Layer.
 * Delegates to the live service's `middleware`.
 */
export const middleware = HttpMiddleware.make(<E, R>(
  httpApp: Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    E,
    HttpServerRequest.HttpServerRequest | R
  >
) =>
  Effect.gen(function*() {
    const { middleware: viteMiddleware } = yield* ViteDevServer
    return yield* viteMiddleware(httpApp)
  })
)
