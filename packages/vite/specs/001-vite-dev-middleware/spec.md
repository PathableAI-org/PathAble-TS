# Feature Specification: Vite Dev Middleware for Effect

**Feature Branch**: `002-vite-dev-middleware`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "We want a feature for the most basic first step. Look at this guide https://vite.dev/guide/ssr . Look at the sample project here: https://github.com/bluwy/create-vite-extra/tree/master/template-ssr-vanilla . The example project does not need any client side js entrypoint at this state. This feature is just about the vite middleware in its most basic form and setting it up to be idiomatically integrated into an Effect server."

## Clarifications

### Session 2026-08-01

- Q: May the published `@pathable/vite` package depend on `@effect/platform-node` (or other `@effect/platform-*` runtime bridges)? → A: **Yes — embrace `@effect/platform-node`.** (Supersedes an earlier “avoid except in example/” decision.) Vite Connect middleware is Node-native; the library SHOULD take `@effect/platform-node` as a peer (and matching `devDependency`) and use `NodeHttpServerRequest` accessors for the bridge.
- Q: Can Vite's Connect middleware be converted to Effect `HttpMiddleware`? → A: Yes. Effect `HttpMiddleware` (Effect 4: `effect/unstable/http`; same idea as `@effect/platform` HttpMiddleware) wraps Connect via `HttpMiddleware.make` + async `(req, res, next)`, using `@effect/platform-node` to obtain Node `IncomingMessage`/`ServerResponse`.
- Q: How should `HttpMiddleware` obtain Node `req`/`res`? → A: Use `@effect/platform-node` `NodeHttpServerRequest.toIncomingMessage` / `toServerResponse` (and `HttpServerResponse.raw` as the sentinel when Vite already wrote the response).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attach Vite Dev Middleware to an Effect Server (Priority: P1)

As a library consumer building an Effect HTTP application on Node, I want to attach Vite's development middleware to my Effect server as Effect `HttpMiddleware` so that Vite handles module transforms, HMR, and static/public assets during development—without running a separate Vite HTTP process alongside my app.

**Why this priority**: This is the foundational integration step from Vite's SSR guide (middleware mode + custom app type). Without it, no later SSR or HTML-serving work can plug into the Effect request pipeline.

**Independent Test**: Start the example Effect server with Vite middleware attached; request a Vite-managed asset or transformed module URL and receive a successful Vite-handled response. No client JS entrypoint and no SSR render pipeline are required.

**Acceptance Scenarios**:

1. **Given** an Effect HTTP server configured with the package's Vite `HttpMiddleware` on `@effect/platform-node`, **When** a request arrives for a resource Vite is responsible for (e.g. a module under the project root or a public asset), **Then** Vite's middleware handles the request and returns the expected transformed or static response through the Effect server.
2. **Given** the same Effect HTTP server, **When** a request arrives for a path Vite does not handle, **Then** control continues through the Effect HTTP pipeline so the consumer can add their own handlers later.
3. **Given** Vite is configured in middleware mode with custom app type (so Vite does not take over HTML serving), **When** the Effect server is running, **Then** Vite does not independently serve as a parallel HTTP listener; all traffic enters via the Effect server.

---

### User Story 2 - Run a Minimal Example Without Client JS (Priority: P2)

As a maintainer or newcomer, I want a runnable `example/` project that demonstrates the Vite middleware attached to an Effect/`@effect/platform-node` server without any client-side JavaScript entrypoint, so I can manually verify the integration and use it as living documentation for this first step.

**Why this priority**: The constitution requires `example/` to grow with the package as docs and a manual test harness. For this slice, the example must stay minimal—no `entry-client`, no hydration.

**Independent Test**: From the package, run the documented example command; the Effect server starts; Vite middleware is active; no client JS entry file is required for the example to succeed.

**Acceptance Scenarios**:

1. **Given** a fresh checkout of the package, **When** a developer runs the example as documented, **Then** an Effect HTTP server starts with Vite development middleware attached and remains reachable.
2. **Given** the running example, **When** inspecting the example project layout, **Then** there is no client-side JavaScript entrypoint required for this feature's demonstration.
3. **Given** the running example, **When** requesting a Vite-handled development resource through the Effect server, **Then** the response is served successfully (confirming middleware is wired).

---

### User Story 3 - Compose Idiomatically in an Effect Stack (Priority: P3)

As a library consumer, I want the Vite development integration exposed as composable Effect constructs (`Layer` + `HttpMiddleware`) so I can wire it into my `@effect/platform-node` stack the same way I compose other platform services—without ad-hoc imperative bootstrap that fights Effect resource lifecycle.

**Why this priority**: Correctness of the HTTP path (P1) matters first; idiomatic Effect composition is required by constitution and determines whether consumers adopt the API, but can be validated once P1 works.

**Independent Test**: A consumer can provide Vite development integration via the package's public Effect surface and shut it down cleanly when the Effect scope/server stops—without orphaned Vite processes.

**Acceptance Scenarios**:

1. **Given** a consumer Effect application using `@effect/platform-node`, **When** they compose the package's Vite `HttpMiddleware` and Vite Dev Layer into their stack, **Then** Vite starts as part of that stack and participates in the HTTP pipeline.
2. **Given** the Effect server (or owning scope) is shut down, **When** teardown completes, **Then** the Vite development server is closed and no orphaned Vite process remains listening.

---

### Edge Cases

- What happens when Vite fails to start (invalid config, missing project root)? The integration MUST surface a clear failure during server startup rather than hanging or silently skipping Vite.
- What happens when a Vite-handled request errors during transform? The error MUST propagate through the Effect HTTP pipeline as a failed request (not crash the entire server process).
- How does the system behave if the consumer has not yet added any HTML/SSR catch-all handler? Unmatched non-Vite routes follow normal Effect HTTP not-found / fallthrough behavior; this feature does not invent an HTML SSR response.
- What happens on repeated attach / double registration? The public API MUST document a single-integration-per-server expectation; double attachment is out of scope for v1 beyond "don't do that."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The package MUST provide a development-time integration that creates a Vite development server in middleware mode with custom app type (Vite does not own HTML serving), matching the basic setup described in Vite's SSR guide and the `template-ssr-vanilla` sample's middleware portion.
- **FR-002**: The package MUST expose Vite's Connect-compatible development middleware as Effect `HttpMiddleware` so Vite-handled requests participate in the consumer's Effect HTTP pipeline—not via a separate parallel Vite HTTP process.
- **FR-003**: The public integration MUST be expressible with Effect idioms (`HttpMiddleware`, Layer/lifecycle, typed errors) so consumers wire it into their Effect stack without bypassing Effect for startup/shutdown.
- **FR-004**: Vite MUST remain the source of truth for module transformation, HMR, and related development middleware behavior; the package wraps and hosts Vite rather than reimplementing those pipelines.
- **FR-005**: The `example/` project MUST demonstrate this integration with an Effect HTTP server on `@effect/platform-node` and MUST NOT require a client-side JavaScript entrypoint for this feature.
- **FR-006**: This feature MUST NOT implement server-side HTML rendering, `ssrLoadModule` / entry-server render, client hydration, or production asset serving—those belong to later features.
- **FR-007**: Startup failures from Vite (e.g. invalid configuration) MUST fail the Effect server startup path with a typed/observable error rather than leaving a half-started server that appears healthy.
- **FR-008**: Request-time failures inside Vite middleware MUST not tear down the Effect HTTP server process; they MUST result in an error response (or Effect failure) for that request only.
- **FR-009**: When the owning Effect scope or HTTP server shuts down, the integration MUST close the Vite development server as part of teardown.
- **FR-010**: The published `@pathable/vite` library MUST declare `@effect/platform-node` as a peer dependency (and MAY list it under `devDependencies` for local check/example), using its Node request/response accessors to bridge Connect `vite.middlewares` into Effect `HttpMiddleware`.
- **FR-011**: The package MUST implement the Vite→Effect request adapter as Effect `HttpMiddleware`—wrapping Connect `vite.middlewares` with fallthrough to the inner Effect app on `next()`, obtaining Node `IncomingMessage`/`ServerResponse` via `@effect/platform-node`.

### Key Entities

- **Vite Dev Integration**: The package-provided capability that owns the Vite development server lifecycle and provides Effect `HttpMiddleware` for request-path integration.
- **Vite HttpMiddleware**: The exported Effect middleware that adapts Connect `vite.middlewares` into the Effect HTTP app pipeline (handled vs fallthrough) using `@effect/platform-node` accessors.
- **Effect HTTP Pipeline**: The consumer's Effect request handling chain hosted with `@effect/platform-node`, into which Vite `HttpMiddleware` is composed so development traffic shares one server entrypoint.
- **Example App**: The version-controlled `example/` project used as documentation and manual verification of the middleware integration (no client JS entry for this slice).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can start the example Effect server with Vite middleware and successfully fetch at least one Vite-handled development resource within 30 seconds of following the documented steps on a typical local machine.
- **SC-002**: 100% of Vite-handled development requests in the example exercise path go through the single Effect HTTP server entrypoint (no second public HTTP listener for Vite).
- **SC-003**: After stopping the example server, no Vite development process remains bound to the example port (verified by a subsequent bind or process check).
- **SC-004**: The example project layout for this feature contains no client-side JavaScript entrypoint, and reviewers can confirm the demonstration without one.
- **SC-005**: A new maintainer can identify from the example alone how to attach Vite development middleware to an Effect server, without reading package source internals.
- **SC-006**: The published package declares `@effect/platform-node` (and `effect`, `vite` as applicable) among its peer dependencies so consumers can resolve the Node HTTP bridge consistently.

## Assumptions

- This feature covers **development middleware only**. Production static serving, SSR HTML injection, preload manifests, and dual client/server builds are deferred to later features (aligned with a staged path toward the constitution's full SSR story).
- Reference behavior is the middleware portion of Vite's SSR guide and `create-vite-extra`'s `template-ssr-vanilla` (create Vite with `middlewareMode: true` and `appType: 'custom'`, then use `vite.middlewares`)—not the subsequent `*all` HTML SSR handler.
- Consumers supply a valid Vite project root / config; the package does not invent an application framework or file-based router.
- A minimal HTML file (without a client script tag) may exist in the example for future SSR work, but serving full SSR HTML via `transformIndexHtml` + render is out of scope here.
- "Idiomatic Effect integration" means lifecycle plus Effect `HttpMiddleware` composition via `@effect/platform-node`; other exact type names (`HttpApp`, Layers, etc.) are planning/implementation choices.
- Peer-dependency rules from the constitution apply: `effect`, `@effect/platform-node`, and `vite` are peers (and may also appear as `devDependencies` for local development). They MUST NOT be nested under `dependencies`.
- Vite Connect middleware is Node-oriented; Bun/Deno Web-fetch hosting without Node-shaped requests is out of scope for this slice.
- Default local ports and Vite config follow ordinary Vite/Effect server conventions unless the example documents otherwise.
