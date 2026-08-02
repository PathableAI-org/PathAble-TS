import { NodeFileSystem, NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import * as ViteDevServer from "@pathable/vite/ViteDevServer"
import { Effect, FileSystem, Layer } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
/**
 * Vite middlewareMode smoke test with Effect HttpServer.
 *
 * - Vite Connect middleware runs first (transforms, public/, HMR client)
 * - `/` SSR-hydrates a React app via transformIndexHtml + entry-client
 * - `/health` is an Effect fallthrough route after Vite `next()`
 * - `/hello.txt` is served from `public/` via Vite middleware
 */
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"

const port = Number(process.env.PORT) || 5173
const root = fileURLToPath(new URL(".", import.meta.url))
const indexHtmlPath = fileURLToPath(new URL("./public/index.html", import.meta.url))

const httpServer = createServer()

const ViteLive = ViteDevServer.layer({
  appType: "custom",
  base: "/",
  root,
  server: {
    middlewareMode: true
  }
})

const HealthRoute = HttpRouter.add(
  "GET",
  "/health",
  Effect.succeed(HttpServerResponse.text("ok"))
)

const HelloRoute = HttpRouter.add(
  "GET",
  "/",
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const req = yield* HttpServerRequest.HttpServerRequest
    const { ssrLoadModule, transformIndexHtml } = yield* ViteDevServer.ViteDevServer

    const url = req.url ?? "/"
    const templateStr = yield* fs.readFileString(indexHtmlPath)
    const template = yield* transformIndexHtml(url, templateStr)
    const { render } = (yield* ssrLoadModule("/src/entry-server.tsx")) as {
      render: (url: string) => { html: string }
    }
    const { html: appHtml } = render(url)
    const html = template.replace("<!--app-html-->", appHtml)

    return HttpServerResponse.html(html)
  })
)

const AppLayer = Layer.mergeAll(
  HelloRoute,
  HealthRoute
)

const ServerLayer = HttpRouter.serve(AppLayer, {
  middleware: ViteDevServer.middleware
}).pipe(
  Layer.provide(NodeHttpServer.layer(() => httpServer, { port })),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(ViteLive)
)

Layer.launch(ServerLayer).pipe(NodeRuntime.runMain)
