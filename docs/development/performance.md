# Performance

**The studio must feel instant with 50 open tabs, 5,000 requests and a 20 MB response. Performance is designed in (budgets, splitting, virtualization, workers), then verified by measurements.**

## Budgets

| Metric | Budget | Checked by |
| --- | --- | --- |
| Initial JS for `/workspaces/[id]` (compressed, modern browsers) | ≤ 290 KB | `e2e/performance-budget.spec.ts` in CI |
| Largest Contentful Paint (production build) | ≤ 1.5 s | `e2e/performance-budget.spec.ts` in CI |
| Cumulative Layout Shift, including a restored layout | < 0.02 | `e2e/performance-budget.spec.ts`, `e2e/shell.spec.ts` in CI |
| Interaction to Next Paint | < 100 ms | Playwright traces, automated with the request editor (M3) |
| Tab switch | < 50 ms | Performance mark in E2E, with tabs (M3) |
| Sidebar with 5,000 items | 60 fps scroll | Virtualized; profiled with the collection tree (M6) |

### How the JavaScript budget is set

The target user is a developer on a laptop or desktop, so the budget is set for that, not for the mobile web.

- **Measured, not guessed.** The planning estimate of 200 KB did not survive measurement: React DOM and the Next.js runtime alone are about 120 KB compressed, a fixed cost of the stack. After the M1 trims (`zod/mini` in the browser, lazy Motion features, a lazy overlay sheet) the studio loads about 272 KB: ~120 KB framework, ~150 KB app.
- **A ratchet.** The budget sits just above the measured size, so any new eager dependency fails CI. When the size drops, the budget is lowered to match; it is never raised to make a change pass. A change that needs more up front is a design discussion recorded in its pull request.
- **What counts.** Scripts referenced by the server HTML, as a modern browser downloads them: `nomodule` legacy polyfills and chunks loaded on demand afterwards are excluded. Monaco and other heavy features must load on demand.
- **Budget history.** Every change to the budget is recorded here with its reason:

  | Milestone | Budget | Measured | Why it moved |
  | --- | --- | --- | --- |
  | M1 | 280 KB | 272 KB | First measured budget, after trimming Zod, Motion and the overlay sheet |
  | M2 | 290 KB | 283 KB | The workspace gate, its store and loader must run on every studio page (+11 KB). The switcher and its menu library load after hydration instead, which kept 32 KB out |
  | M3 | 290 KB | 288 KB | Unchanged. Tabs, the request editor, Monaco and dnd-kit load in their own chunks after the shell paints; the global error page stopped bundling the whole message catalog, and `package.json` left the bundle (−4 KB) |
  | M4 | 290 KB | 289 KB | Unchanged. The executor switch, console and response view load after the shell paints behind the empty states the server renders; the runner never reaches the browser |

- **Bytes are a proxy.** LCP, layout shift and, from M3, interaction latency are what users feel, and they are budgeted alongside.

## Strategies

| Area | Approach |
| --- | --- |
| Code splitting | Monaco, previews (HTML, Markdown, image), code generation, import dialog, settings sections and onboarding are separate chunks loaded on demand; code generators are lazy per target |
| Rendering | React Compiler for automatic memoisation; components subscribe to narrow store slices; per-tab state keyed by `tabId` so typing in one tab never re-renders another |
| Lists | TanStack Virtual for the collection tree (flattened visible nodes), history, JSON tree and tables over 100 rows |
| Large responses | Bodies over 1 MB are parsed and formatted in a Web Worker; above 5 MB the pretty view is opt-in and raw view streams into Monaco; the JSON tree expands lazily |
| Editor | One Monaco instance per visible editor; models are disposed when tabs close; inactive tabs keep only their text |
| Persistence | Debounced auto-save of drafts (400 ms) and the tab layout (300 ms), flushed when the page is hidden; IndexedDB writes batched in transactions; history bodies stored separately and loaded lazily |
| Startup | `localStorage` stores hydrate synchronously (no layout shift); IndexedDB hydrates behind skeletons; fonts via `next/font` with `display: swap` and preloading |
| Transitions | `useTransition` / `useDeferredValue` for search filtering and large view switches |
| Suspense | Each panel is its own Suspense and error boundary, so a slow or failed panel never blocks the shell |
| Optimistic updates | Renames, moves, deletes and saves update the store first and roll back on failure ([state-management.md](../architecture/state-management.md#services-write-through-and-optimistic-updates)) |
| Network | Proxy streams upstream bodies with a size cap; client cancels abort the upstream request |
| Assets | SVG illustrations inline and tree-shaken; Lucide icons imported individually |
| Browser dependencies | Schemas that run in the browser use `zod/mini` (the full Zod API costs ~50 KB); Motion renders `m.*` components under `LazyMotion strict` with its features in an async chunk; UI used only in some layouts (the overlay sidebar) loads with `next/dynamic` |

## Measuring

- The budget test annotates each run with the measured size, so the Playwright report shows how far a change moved it.
- To see what a chunk contains, build and inspect `apps/web/.next/static/chunks`; the scripts a page loads up front are the `<script src>` tags in its server HTML.
- React Profiler and the Performance panel for interaction work; findings that change code get a short note in the PR.
- `performance.mark` around send → render and tab switch, read by E2E tests.
