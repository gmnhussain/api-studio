# Architecture Overview

**A pnpm + Turborepo monorepo. The web app is a thin, feature-sliced Next.js shell; the request engine is a framework-free TypeScript package that the web app, the server proxy and a future CLI all share.**

## System at a glance

```text
┌──────────────────────────── Browser ────────────────────────────┐
│ apps/web (Next.js App Router, client-heavy)                     │
│                                                                  │
│  features/*  ── UI + hooks + stores (Zustand) ──┐                │
│                                                  │ uses           │
│  @api-studio/core  (models, Zod schemas, variable resolution,   │
│                     codegen, import/export, registries)          │
│                                                  │                │
│  persistence (IndexedDB via repositories) ◄──────┘                │
│                                                                  │
│  RequestExecutor ──┬── ProxyExecutor ── POST /api/v1/executions ─┼──┐
│                    └── BrowserExecutor (direct fetch, CORS-bound)│  │
└──────────────────────────────────────────────────────────────────┘  │
                                                                      │
┌──────────────── Next.js server (Route Handler) ────────────────┐   │
│ /api/v1/executions ── validate (Zod) ── @api-studio/runner ◄────┼───┘
│                                         (undici fetch, redirects,│
│                                          timeouts, SSRF guard)   │──► Target API
└──────────────────────────────────────────────────────────────────┘
```

Why a server hop exists at all: browsers enforce CORS and forbid headers such as `Cookie`, `Host` and `Origin`. A real API client must send exactly what the user wrote, so requests go through a small proxy by default. See [ADR-0003](./adr/0003-request-execution-through-proxy.md) and [request-execution.md](./request-execution.md).

## Technology stack

| Concern | Choice | Why |
| --- | --- | --- |
| Runtime / package manager | Node 24 LTS, pnpm 11 (workspaces + catalog) | One version per dependency across the repo; strict, fast installs |
| Monorepo orchestration | Turborepo | Cached `lint` / `typecheck` / `test` / `build` per package ([ADR-0001](./adr/0001-monorepo-with-framework-free-core.md)) |
| Framework | Next.js 16 (App Router), React 19, React Compiler | Routing, layouts, Route Handlers for the proxy, `next/font`, code splitting; the compiler removes most manual memoisation |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`) | Correctness at the type level; no `any` |
| Styling | Tailwind CSS v4 (CSS-first `@theme`), `tw-animate-css` | Design tokens as CSS variables, zero runtime |
| Components | shadcn/ui (Base UI primitives), `cmdk`, `sonner` | Accessible primitives we own and restyle; no third-party look |
| Panels | `react-resizable-panels` (shadcn Resizable) | Accessible, keyboard-resizable, persisted layouts |
| Drag and drop | `dnd-kit` | Accessible (keyboard + screen reader), works for both tab strip and tree ([ADR-0008](./adr/0008-dnd-kit-for-drag-and-drop.md)) |
| Client state | Zustand, one store per domain | Small, selector-based, no providers ([ADR-0004](./adr/0004-state-management.md)) |
| Async I/O state | TanStack Query | Execution lifecycle (pending, cancel, retry), lazy IndexedDB reads, future remote sync |
| Persistence | IndexedDB through Dexie, behind repository interfaces | Large data (history, responses) off `localStorage`; swappable for sync later ([ADR-0002](./adr/0002-local-first-indexeddb-persistence.md)) |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) | Dialogs and settings; same schemas as the domain |
| Validation | Zod 4 | Every trust boundary: imports, persisted data, proxy input/output, env |
| Code editor | Monaco Editor (`@monaco-editor/react`), lazy-loaded | VS Code-grade editing, themed from our tokens ([ADR-0009](./adr/0009-monaco-editor-lazy-loaded.md)) |
| Virtualization | TanStack Virtual | History, large trees, JSON tree, long header tables |
| Motion | Motion (`motion/react`, formerly Framer Motion) | Layout and presence animations, reduced-motion aware |
| Icons | Lucide | One consistent stroke set |
| Dates | date-fns | Tree-shakable, immutable |
| Theme | `next-themes` | Class strategy, no flash on load |
| HTTP engine (server) | `undici` (Node's fetch) in `packages/runner` | Manual redirect handling, timing hooks, abort |
| Lint / format | ESLint 9 flat config (`typescript-eslint` strict type-checked), Prettier | [ADR-0007](./adr/0007-eslint-prettier.md) |
| Boundaries | dependency-cruiser | Enforces the import rules below in CI |
| Tests | Vitest, Testing Library, Playwright, axe | [testing.md](../development/testing.md) |

Exact versions are pinned once in `pnpm-workspace.yaml` (`catalog:`); upgrades are deliberate and reasoned in the commit.

## Repository layout

```text
api-studio/
├── apps/
│   └── web/                     Next.js app (UI, proxy Route Handler)
├── packages/
│   ├── core/                    @api-studio/core — framework-free domain + engine logic
│   ├── runner/                  @api-studio/runner — Node HTTP execution engine (proxy, future CLI)
│   └── config/                  @api-studio/config — shared ESLint, Prettier, TS, Vitest presets
├── docs/                        product, architecture, design, development
├── .github/                     CI workflows, issue / PR templates, Dependabot
├── turbo.json
└── pnpm-workspace.yaml
```

Not created up front: `packages/ui` (until a second app needs the components), `apps/cli`, `apps/desktop`. Each arrives with the feature that needs it.

## `packages/core` — the engine

Pure TypeScript. No React, no Next.js, no DOM, no Node-only APIs. Runs in the browser, on the server and in a future CLI.

```text
packages/core/src/
├── models/            Types + Zod schemas: workspace, collection, request, environment, response, history
├── ids/               Branded ids and their factories
├── http/              URL parsing/building, query ⇄ URL sync, path variables, headers, auth application,
│                      body serialization, cookie parsing, size calculation, status classes
├── variables/         {{var}} tokenizer, scope merge, resolver, autocomplete candidates
├── execution/         RequestExecutor interface, ExecutionPlan, error taxonomy, protocol adapter contract
├── code-generation/   CodeGenerator contract + one file per target
├── import-export/     Collection document v1 + migrations, Postman v2.1 and cURL importers, OpenAPI entry
├── registry/          createRegistry() used by every extension point
└── search/            Fuzzy matching and ranking
```

## `apps/web` — the application

```text
apps/web/src/
├── app/                         Routes only: layouts, pages, route handlers. No business logic.
├── features/                    One folder per product feature (below)
├── components/
│   ├── ui/                      shadcn/ui primitives (generated by the CLI, then themed)
│   └── common/                  Shared composites: CodeEditor, Panel, EmptyState, Kbd, …
├── hooks/                       Shared hooks: use-hotkey, use-media-query, use-debounced-callback
├── stores/                      Cross-feature stores only (ui.store.ts)
├── lib/                         App infrastructure: db (Dexie), executors, query client, cn()
├── config/                      Typed app config, env validation, keyboard map, route builders
├── constants/                   Storage keys, limits, durations, z-index scale
├── styles/                      globals.css, tokens, Monaco themes
├── i18n/                        Message catalog (see open question in milestones.md)
└── types/                       Global ambient types only; domain types live in @api-studio/core
```

### Feature slice

```text
features/collections/
├── components/        collection-tree.tsx, collection-tree-item.tsx, folder-context-menu.tsx
├── hooks/             use-collection-tree.ts, use-collection-actions.ts
├── stores/            collection.store.ts
├── services/          collection.service.ts      orchestrates store + repository + toasts
├── repositories/      collection.repository.ts   IndexedDB access only
├── commands/          collection.commands.ts     palette commands + shortcuts it contributes
├── collections.constants.ts
└── index.ts           public API — the only file other features may import
```

Features: `workspace`, `shell`, `collections`, `request-builder`, `response-viewer`, `execution`, `tabs`, `history`, `environments`, `console`, `command-palette`, `search`, `code-generation`, `import-export`, `settings`, `onboarding`.

### Layers inside the app

| Layer | Knows about | Never |
| --- | --- | --- |
| `app/` routes | features' public APIs | Holds state or logic |
| Components | hooks, stores (via selectors), `components/*` | Calls a repository or executor directly |
| Hooks | stores, services, TanStack Query | Renders UI |
| Services | stores, repositories, executors, `@api-studio/core` | Imports React components |
| Repositories | Dexie tables, Zod schemas | Contains business rules |
| `@api-studio/core` | nothing in the app | Imports React, Next.js, DOM or Node APIs |

## Module boundaries (enforced by dependency-cruiser)

1. `packages/core` imports nothing from `apps/*` or `packages/runner`, and no `react`, `next`, `dexie` or `node:*`.
2. `packages/runner` imports `packages/core`, never `apps/*`.
3. A feature imports another feature only through its `index.ts`.
4. `components/*`, `hooks/*`, `lib/*` never import from `features/*`.
5. Only `app/api/**` imports `@api-studio/runner` (it must never reach the client bundle; it also imports `server-only`).
6. No circular imports anywhere.

## Routing

The studio is a client-heavy application rendered inside a server layout. Tabs, panels and sidebar sections are client state, not routes, so switching is instant and nothing re-renders on the server.

| Route | Purpose | Rendering |
| --- | --- | --- |
| `/` | Redirect to the last workspace, or to onboarding on first run | Client redirect (data is local) |
| `/onboarding` | First-run flow | Client |
| `/workspaces/[workspaceId]` | The studio: sidebar, tabs, editor, response, console | Server layout + client shell |
| `/settings/[[...section]]` | Settings: `appearance`, `editor`, `requests`, `shortcuts`, `data`, `about` | Server layout + client sections |
| `/api/v1/executions` | `POST` — execute a request through the runner | Route Handler (Node runtime) |
| `/api/v1/health` | Liveness for deployments | Route Handler |

Route paths are built only through `config/routes.ts` (no string literals in components). Route groups: `(studio)` shares the app shell and providers; `(standalone)` holds onboarding. Each route segment has `loading.tsx` (skeleton) and `error.tsx`.

## Cross-cutting

| Concern | Approach |
| --- | --- |
| Errors | Expected failures are values (`Result<T, E>` in core, typed `ExecutionError` codes); unexpected ones throw to the nearest error boundary and are logged to the console panel |
| Configuration | `config/env.ts` validates env with Zod at startup; the server exits on invalid config |
| Security | Proxy SSRF guard, response size cap, HTML previews in a sandboxed iframe, secrets masked and excluded from exports; see [request-execution.md](./request-execution.md#security) |
| Extensibility | Registries for protocols, auth schemes, body types, code generators, importers, response viewers and commands; see [extensibility.md](./extensibility.md) |

Related: [data-model.md](./data-model.md), [state-management.md](./state-management.md), [request-execution.md](./request-execution.md), [adr/](./adr/).
