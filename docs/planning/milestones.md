# Milestones

**Ten milestones from an empty repository to v0.1.0. Each one ends in a working, demoable state with its tests green; nothing is "almost done" across a milestone boundary.**

| Milestone | Theme | Feature ids | Release |
| --- | --- | --- | --- |
| M0 | Foundation and tooling | — | — |
| M1 | Design system and app shell | F-31, F-34 | — |
| M2 | Core domain and persistence | F-20, F-28 (model) | — |
| M3 | Request builder and tabs | F-01–F-09, F-23–F-25 | — |
| M4 | Execution engine and proxy | F-10, F-17, F-35 | — |
| M5 | Response viewer | F-11–F-16, F-41 | — |
| M6 | Collections, history, environments, search | F-21, F-22, F-26–F-29 | — |
| M7 | Command palette, shortcuts, code generation, import/export | F-30, F-32, F-33, F-40, F-44–F-46 | — |
| M8 | Settings, onboarding and polish | F-36–F-38, F-42, F-43, F-47 | — |
| M9 | Release | — | v0.1.0 |

## M0 — Foundation and tooling

> **Done** (2026-10-13). CI covers gates 1–6, 9 and 10 from [testing.md](../development/testing.md#ci-gates-every-push-and-pull-request); E2E (gate 7) arrives with the first screens in M1 and the bundle budget (gate 8) with the shell.
- pnpm workspace + catalog, Turborepo, Node 24 pin, `packageManager` field.
- `packages/config`: TypeScript, ESLint (ADR-0007), Prettier, Vitest presets.
- `apps/web`: Next.js 16 + React 19 + React Compiler, Tailwind v4, shadcn/ui init, `@/*` alias.
- `packages/core` and `packages/runner` skeletons with one passing test each.
- dependency-cruiser rules from [overview.md](../architecture/overview.md#module-boundaries-enforced-by-dependency-cruiser).
- commitlint, GitHub Actions CI (gates 1–6, 9, 10), Dependabot, issue / PR templates, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- `docs/development/setup.md`.

**Exit:** `pnpm install && pnpm dev` shows a page; `pnpm lint typecheck test build` pass locally and in CI.

## M1 — Design system and app shell

> **Done** (2026-10-14). The shell is axe-clean in both themes and passes the E2E suite in Chromium, Firefox and WebKit. Initial JavaScript is 272 KB against a 280 KB budget set from measurement ([performance.md](../development/performance.md#how-the-javascript-budget-is-set)). The phone-width layout (bottom bar, request / response switch) moved to M8; those widths use the tablet layout until then.

- Tokens (`tokens.css`), Tailwind `@theme` mapping, fonts, cookie-backed appearance settings with a pre-paint boot script, accent and density attributes, token contrast test.
- shadcn primitives added and themed; `components/common` basics (`Panel`, `EmptyState`, `ShortcutHint`, `ThemeSwitcher`, illustrations). `SearchInput` arrives with sidebar search in M6.
- `AppShell`: activity rail, resizable sidebar, tab strip area, editor / response split, console, status bar, all collapsible with persisted sizes (UI store).
- Responsive breakpoints; reduced motion and transparency.
- Route skeleton: `(studio)` with the workspace and settings routes, `loading.tsx` / `error.tsx` / `not-found.tsx`. The `(standalone)` group arrives with onboarding in M8.
- Message catalog (next-intl), first Playwright + axe E2E suite and the initial-JS budget check.

**Exit:** the full shell with empty states in dark and light, keyboard-resizable panels, axe-clean.

## M2 — Core domain and persistence

> **Done** (2026-10-14). Core holds the domain models, variable resolution, URL and request building and the collection tree rules, at 98% line coverage enforced in CI. Workspaces persist in IndexedDB, stay in step across tabs and are managed from the top bar; `/` reopens the last one, redirecting on the server. Collections and environments have their repositories, stores and services; their UI is M6 as planned. Initial JavaScript is 283 KB against a 290 KB budget.

- `core/models` schemas and types, branded ids, `Result`, registries, fractional-index sort keys.
- `core/variables` (tokenizer, scope merge, resolver) and `core/http` (URL ⇄ params, path variables, headers, auth application, body serialization, sizes) with full unit tests.
- Dexie database, repositories, migrations, `BroadcastChannel` sync.
- Workspace, collection, environment stores and services with optimistic write-through.

**Exit:** domain logic covered ≥ 90%; workspace data survives reload and stays consistent across browser tabs.

## M3 — Request builder and tabs

> **Done** (2026-10-14). Requests are composed in tabs with a colour-coded method picker, a URL bar that highlights `{{variables}}` and completes them, query and path tables in step with the URL, headers with name suggestions and the generated headers, cookies, six auth schemes, seven body types with Monaco for text bodies, and request settings. Drafts auto-save and restore exactly after a reload; the first save asks for a collection (the collection tree arrives in M6). The tab strip drags, pins, closes in every variant with a prompt for unsaved changes, reopens closed tabs and has keyboard shortcuts. The E2E suite covers it in Chromium, Firefox and WebKit. Initial JavaScript is 288 KB against the unchanged 290 KB budget. Sending arrives with M4, variable hover previews with the variables view in M6, and bulk-edit for tables in M8.

- Tabs store and `EditorTabs` (dnd-kit reorder, pin, close variants, dirty dot, restore, overflow).
- Request store with drafts and debounced auto-save; explicit save.
- `RequestMethodSelect`, `VariableInput`-based URL bar with highlighting and `{{` autocomplete, section tabs with counts.
- `KeyValueTable` for params, path variables, headers (with header autocomplete) and cookies; `AuthEditor`; `BodyEditor` with lazy `CodeEditor`.

**Exit:** a full request can be composed, saved, closed and restored exactly.

## M4 — Execution engine and proxy

> **Done** (2026-10-14). Requests plan in core (variables, path variables, auth, body, cookies) and are refused before sending when a variable has no value. The runner sends them with undici: manual redirects with RFC 9110 method rules, decoding, a size cap, timings, error mapping and an SSRF guard that checks every connected address; integration tests run it against a local server. `POST /api/v1/executions` validates its input and passes the caller's cancel through; its limits come from validated `PROXY_*` variables. The proxy and browser executors share one contract; the status bar switches between them. Send (`Mod+Enter`) turns into Cancel (`Esc`); each tab keeps its latest result, retries the exact request, and cookies from responses go into the workspace's jar. Every error code is explained in the response panel and logged in the new console. The lifecycle runs in a service instead of TanStack Query ([ADR-0012](../architecture/adr/0012-execution-lifecycle-in-a-service.md)). E2E tests run against a local test API in Chromium, Firefox and WebKit. Initial JavaScript is 289 KB against the 290 KB budget. The response viewers (pretty, tree, previews, timeline) are M5.

- `RequestExecutor` contract and the execution pipeline in core.
- `packages/runner`: undici execution, manual redirects, timeouts, cancel, size cap, timings, error mapping, SSRF guard; integration tests against a local server.
- `POST /api/v1/executions`, env validation, `ProxyExecutor`, `BrowserExecutor`.
- `useExecuteRequest` (send, cancel, retry), console feature with execution logs, cookie jar.

**Exit:** requests to the local test API and public APIs work; every `ExecutionError` code is tested and explained in the UI.

## M5 — Response viewer

> **Done** (2026-10-14). Response bodies show through a viewer registry: pretty (JSON and XML formatted, every text format highlighted), a virtualized JSON tree with the WAI-ARIA keyboard model and copy value / JSONPath, raw, and image, HTML and Markdown previews; each tab keeps its section and view. Bodies over 1 MB are formatted and parsed in a Web Worker that keeps the document for the tree, which lists one level at a time and groups large containers into ranges; text over 2 MB skips the code editor for a row view whose scroll height is capped and scaled. With a 20 MB JSON body no main-thread task passes 96 ms in Chromium. HTML previews run in a sandbox whose content security policy loads nothing; Markdown never renders raw HTML or remote images; previews follow the theme. Headers and cookies are filterable tables, the timeline shows phases, sizes and the redirect chain, and copy / download use the name the response suggests. Initial JavaScript is 289 KB against the 290 KB budget.

- Status bar (status, time, size), body views (pretty, raw, preview) through the response viewer registry.
- `JsonTree` (virtualized, copy path / value), image, sandboxed HTML and Markdown previews; Web Worker formatting for large bodies.
- Headers, cookies, timeline and redirect chain; copy and download.

**Exit:** a 20 MB JSON response stays responsive; all previews are safe and themed.

## M6 — Collections, history, environments, search

- `CollectionTree`: virtualized, WAI-ARIA tree keyboard model, dnd-kit move / reorder, inline rename, context menus, duplicate, delete with undo.
- History: recorded on execution, grouped by day, virtualized, open in a tab, save to collection, retention limit.
- Environments editor, `EnvironmentSelector`, variables view across scopes, secret masking.
- `VariableInput` hover preview of a variable's value and scope.
- Sidebar filter and global search.

**Exit:** 5,000 items scroll smoothly; every tree action works by keyboard only.

## M7 — Command palette, shortcuts, code generation, import/export

- Command registry, keymap, `CommandPalette` with prefixes and recents, shortcut cheat sheet, context menus wired to commands.
- Code generators for all 8 targets with golden tests; `CodeSnippetDialog`.
- Native export / import, Postman v2.1 importer, cURL importer (URL-bar paste), OpenAPI entry point.

**Exit:** every action is reachable from the palette; exported collections re-import identically.

## M8 — Settings, onboarding and polish

- Settings sections for editor, requests, shortcuts and data (appearance and about shipped in M1), with React Hook Form + Zod.
- Phone-width layout (< 768 px): rail as a bottom bar, request / response switch, console in a sheet.
- Onboarding flow; recent requests; saved responses; accent presets.
- `KeyValueTable` bulk-edit mode and arrow-key row navigation.
- Motion pass (signature micro-interactions), empty-state illustrations, copywriting pass.
- Accessibility audit (axe + NVDA / VoiceOver), performance audit against budgets.

**Exit:** a first-time user sends a request in under 30 seconds; budgets met.

## M9 — Release v0.1.0

- README with real screenshots and a short demo GIF, finished docs, `CHANGELOG.md`.
- Hosted demo (Vercel) with proxy hardening (SSRF, rate limits, caps).
- Merge `develop` → `main`, tag `v0.1.0`.

**Exit:** public demo and tagged release.

## After v0.1

v0.2 request comparison (F-48), OpenAPI import, OAuth 2.0 flows, form-data files and binary bodies · v0.3 GraphQL (F-60) · v0.4 WebSocket and SSE (F-61, F-62) · then CLI (F-69), scripts and tests (F-65), plugins (F-68), sync (F-66).

## Decisions (2026-10-13)

The open questions from planning were settled with the recommended options:

| Question | Decision |
| --- | --- |
| UI text | Message catalog from day one: next-intl, English first ([ADR-0010](../architecture/adr/0010-ui-text-in-message-catalog.md)) |
| Licence | MIT |
| Accent | "Ion" blue is the default; Iris, Ember, Moss and Graphite are presets |
| Hosting | Vercel for the demo and previews; proxy hardening applies wherever it is hosted |
| Component catalogue | No Storybook in M1. Components are covered by tests and visible in the app; revisit after M3, when the request builder makes a catalogue worth its upkeep |
