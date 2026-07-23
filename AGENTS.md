# PathAble-TS

Effect TypeScript monorepo. Uses pnpm workspaces.

## Build & check
- `pnpm build` — build all packages
- `pnpm check` — typecheck all packages
- `pnpm lint` — lint all packages
- `pnpm format` — format all packages

## Effect best practices
Use `pnpm effect-solutions` to browse idiomatic Effect patterns:
- `pnpm effect-solutions list` — list available topics
- `pnpm effect-solutions show <topic>` — view a specific topic (e.g. `basics`, `data-modeling`, `error-handling`, `testing`)
- `pnpm effect-solutions open-issue` — open a GitHub issue

The `bun` runtime is provided as a dev dependency — no global install needed.