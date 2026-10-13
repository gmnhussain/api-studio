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

- `core/models` schemas and types, branded ids, `Result`, registries, fractional-index sort keys.
- `core/variables` (tokenizer, scope merge, resolver) and `core/http` (URL ⇄ params, path variables, headers, auth application, body serialization, sizes) with full unit tests.
- Dexie database, repositories, migrations, `BroadcastChannel` sync.
- Workspace, collection, environment stores and services with optimistic write-through.

**Exit:** domain logic covered ≥ 90%; workspace data survives reload and stays consistent across browser tabs.

## M3 — Request builder and tabs

- Tabs store and `EditorTabs` (dnd-kit reorder, pin, close variants, dirty dot, restore, overflow).
- Request store with drafts and debounced auto-save; explicit save.
- `RequestMethodSelect`, `VariableInput`-based URL bar with highlighting and `{{` autocomplete, section tabs with counts.
- `KeyValueTable` for params, path variables, headers (with header autocomplete) and cookies; `AuthEditor`; `BodyEditor` with lazy `CodeEditor`.

**Exit:** a full request can be composed, saved, closed and restored exactly.

## M4 — Execution engine and proxy

- `RequestExecutor` contract and the execution pipeline in core.
- `packages/runner`: undici execution, manual redirects, timeouts, cancel, size cap, timings, error mapping, SSRF guard; integration tests against a local server.
- `POST /api/v1/executions`, env validation, `ProxyExecutor`, `BrowserExecutor`.
- `useExecuteRequest` (send, cancel, retry), console feature with execution logs, cookie jar.

**Exit:** requests to the local test API and public APIs work; every `ExecutionError` code is tested and explained in the UI.

## M5 — Response viewer

- Status bar (status, time, size), body views (pretty, raw, preview) through the response viewer registry.
- `JsonTree` (virtualized, copy path / value), image, sandboxed HTML and Markdown previews; Web Worker formatting for large bodies.
- Headers, cookies, timeline and redirect chain; copy and download.

**Exit:** a 20 MB JSON response stays responsive; all previews are safe and themed.

## M6 — Collections, history, environments, search

- `CollectionTree`: virtualized, WAI-ARIA tree keyboard model, dnd-kit move / reorder, inline rename, context menus, duplicate, delete with undo.
- History: recorded on execution, grouped by day, virtualized, open in a tab, save to collection, retention limit.
- Environments editor, `EnvironmentSelector`, variables view across scopes, secret masking.
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
