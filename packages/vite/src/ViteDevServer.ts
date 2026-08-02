import * as NodeHttpServerRequest from "@effect/platform-node/NodeHttpServerRequest"
import { Context, Effect, Layer } from "effect"
import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import { createServer, type ViteDevServer } from "vite"

import { ViteDevStartError, ViteMiddlewareError } from "./errors.js"

export type ServerOptions = Parameters<typeof createServer>[0]

export class Server extends Context.Service<Server, {
  readonly transformIndexHtml: (
    url: string,
    template: string,
    originalUrl?: string
  ) => Effect.Effect<string, never>
  readonly vite: ViteDevServer
}>()("@pathable/vite/Server") {}

export const make = (
  options: ServerOptions
): Effect.Effect<Server["Service"], ViteDevStartError> =>
  Effect.tryPromise({
    catch: (cause) => new ViteDevStartError({ cause }),
    try: () => createServer(options)
  }).pipe(Effect.map((vite) =>
    Server.of({
      transformIndexHtml: (
        url: string,
        template: string,
        originalUrl?: string
      ) =>
        Effect.promise(() =>
          vite.transformIndexHtml(
            url,
            template,
            originalUrl
          )
        ),
      vite
    })
  ))

export const layer = (
  options: ServerOptions
) => Layer.effect(Server, make(options))

export const middleware = HttpMiddleware.make(<E, R>(
  httpApp: Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    E,
    HttpServerRequest.HttpServerRequest | R
  >
): Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  E | ViteMiddlewareError,
  HttpServerRequest.HttpServerRequest | R | Server
> =>
  Effect.gen(function*() {
    const { vite } = yield* Server
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

      vite.middlewares(req, res, next)
    })
  })
)
