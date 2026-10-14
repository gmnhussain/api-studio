<div align="center">

# API Studio

**A local-first, keyboard-driven workspace for designing, sending and understanding HTTP requests.**

![Status](https://img.shields.io/badge/status-in%20development-0ea5e9)
![License](https://img.shields.io/badge/license-MIT-22c55e)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)

</div>

> **Status:** the foundation (M0) and the design system and app shell (M1) are in place: tokens with a contrast test, light and dark themes, a resizable studio shell, settings, and E2E, accessibility and performance gates in CI. M2 added the domain engine (models, variables, URL and request building) and local-first persistence with workspaces that sync across tabs. M3 added the request builder and tabs: compose any request with variables, auth and bodies, save it to a collection and get it back exactly after a reload. M4 sends them: through a small server proxy that sends exactly what you wrote (or straight from the browser), with cancel, retry, a cookie jar, explained errors and a console. M5 shows what comes back: pretty, tree and raw views, safe previews, headers, cookies and a timeline, smooth even with a 20 MB body. Collections, history, environments and search (M6) are next. See the [milestone plan](./docs/planning/milestones.md).

<!-- Screenshots and a short demo GIF are added in milestone M9. -->

## Why API Studio

API clients tend to be either heavy (accounts, cloud sync by default, slow to start) or bare. API Studio aims for the depth of a professional tool with the speed and calm of a modern code editor:

- **Local-first.** No account, no telemetry. Your data stays in your browser and exports to an open, versioned format.
- **Keyboard first.** A command palette for everything, shortcuts for what you do often.
- **Honest.** See exactly what was sent and received: resolved URL, final headers, sizes, timings, redirect chain.
- **Extensible by design.** Protocols, auth schemes, code generators, importers and viewers plug into typed registries.

## Features

### v0.1 (MVP)

- REST requests with `GET` `POST` `PUT` `PATCH` `DELETE` `OPTIONS` `HEAD`
- Query parameters synced with the URL, path variables, headers, cookies
- Auth: Basic, Bearer, API key, OAuth 2.0 configuration, inherited from folders and collections
- Bodies: JSON, form data, `x-www-form-urlencoded`, raw text, XML
- Response viewer: status, time, size, headers, cookies, pretty / raw / preview, JSON tree, image, HTML and Markdown previews
- Collections with folders, drag and drop, rename, duplicate, delete with undo
- Tabs with drag to reorder, pinning, restore after reload and auto-save
- Environments and `{{variable}}` autocomplete with global, collection and environment scopes
- History, global search, command palette (`Ctrl K`), keyboard shortcuts
- Dark and light themes, resizable panels, console

### Next

Code generation (cURL, fetch, Axios, Python, Node.js, PHP, Go, Java), response timeline, saved responses, Postman, cURL and OpenAPI import, then GraphQL, WebSocket, SSE, CLI and plugins. Full list in [features.md](./docs/product/features.md).

## Architecture

```text
apps/web            Next.js App Router UI, feature-sliced; proxy Route Handler at /api/v1/executions
packages/core       Framework-free engine: models, Zod schemas, variables, HTTP utilities, codegen, import/export
packages/runner     Node HTTP engine (undici): redirects, timeouts, cancel, size caps, SSRF guard
packages/config     Shared TypeScript, ESLint, Prettier and Vitest presets
```

- **Requests go through a small server proxy by default**, so they leave exactly as written (no CORS limits, real cookies, a visible redirect chain). A direct browser mode is available too. [Why](./docs/architecture/adr/0003-request-execution-through-proxy.md)
- **State is split per domain** into small Zustand stores, with TanStack Query for async lifecycles. [Details](./docs/architecture/state-management.md)
- **Data is stored in IndexedDB** behind repository interfaces, ready for sync later. [Why](./docs/architecture/adr/0002-local-first-indexeddb-persistence.md)
- **Module boundaries are enforced in CI** with dependency-cruiser.

Start with the [architecture overview](./docs/architecture/overview.md) and the [decision records](./docs/architecture/adr/).

## Tech stack

| Area | Tools |
| --- | --- |
| App | Next.js 16 (App Router), React 19, React Compiler, TypeScript (strict) |
| UI | Tailwind CSS 4, shadcn/ui, Motion, Lucide, Monaco Editor, dnd-kit, react-resizable-panels, cmdk |
| State and data | Zustand, TanStack Query, Dexie (IndexedDB), Zod, React Hook Form, date-fns |
| Engine | undici (Node), pure TypeScript core |
| Quality | ESLint (typescript-eslint strict), Prettier, Vitest, Testing Library, Playwright, axe, dependency-cruiser, commitlint |
| Tooling | pnpm workspaces, Turborepo, GitHub Actions |

## Repository structure

```text
api-studio/
├── apps/web/                  Next.js application
│   └── src/
│       ├── app/               routes, layouts, route handlers
│       ├── features/          collections, request-builder, response-viewer, tabs, history, …
│       ├── components/        ui (shadcn primitives) and common composites
│       ├── hooks/ lib/ stores/ config/ constants/ styles/ types/
├── packages/core/             engine (framework-free)
├── packages/runner/           Node HTTP engine
├── packages/config/           shared tooling presets
└── docs/                      product, architecture, design, development, planning
```

## Roadmap

| Version | Focus |
| --- | --- |
| v0.1 | REST client, collections, environments, history, command palette, themes |
| v0.2 | Request comparison, OpenAPI import, OAuth 2.0 flows, file and binary bodies |
| v0.3 | GraphQL |
| v0.4 | WebSocket and Server-Sent Events |
| Later | CLI, scripts and tests, mock server, plugins, sync and team workspaces, AI assistant |

## Getting started

Requirements: Node 24 and pnpm 11.

```bash
corepack enable
pnpm install
pnpm dev
```

Then open http://localhost:3000. All commands are in the [setup guide](./docs/development/setup.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md), the [conventions](./docs/development/conventions.md) and the [git workflow](./docs/development/git-workflow.md) first: Conventional Commits, small focused changes, and docs updated alongside behaviour. Report security issues privately as described in [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © G. M. Nazmul Hussain
