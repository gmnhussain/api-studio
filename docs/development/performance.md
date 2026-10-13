# Performance

**The studio must feel instant with 50 open tabs, 5,000 requests and a 20 MB response. Performance is designed in (budgets, splitting, virtualization, workers), then verified by measurements.**

## Budgets

| Metric | Budget | Checked by |
| --- | --- | --- |
| Initial JS for `/workspaces/[id]` (gzip, excl. Monaco) | ≤ 200 KB | CI bundle size check |
| Largest Contentful Paint (local, mid-range laptop) | ≤ 1.5 s | Lighthouse in CI on the built app |
| Cumulative Layout Shift | < 0.02 | Lighthouse |
| Interaction to Next Paint | < 100 ms | Manual profiling + Playwright traces |
| Tab switch | < 50 ms | Performance mark in E2E |
| Sidebar with 5,000 items | 60 fps scroll | Virtualized; profiled |

## Strategies

| Area | Approach |
| --- | --- |
| Code splitting | Monaco, previews (HTML, Markdown, image), code generation, import dialog, settings sections and onboarding are separate chunks loaded on demand; code generators are lazy per target |
| Rendering | React Compiler for automatic memoisation; components subscribe to narrow store slices; per-tab state keyed by `tabId` so typing in one tab never re-renders another |
| Lists | TanStack Virtual for the collection tree (flattened visible nodes), history, JSON tree and tables over 100 rows |
| Large responses | Bodies over 1 MB are parsed and formatted in a Web Worker; above 5 MB the pretty view is opt-in and raw view streams into Monaco; the JSON tree expands lazily |
| Editor | One Monaco instance per visible editor; models are disposed when tabs close; inactive tabs keep only their text |
| Persistence | Debounced auto-save (500 ms) of drafts; IndexedDB writes batched in transactions; history bodies stored separately and loaded lazily |
| Startup | `localStorage` stores hydrate synchronously (no layout shift); IndexedDB hydrates behind skeletons; fonts via `next/font` with `display: swap` and preloading |
| Transitions | `useTransition` / `useDeferredValue` for search filtering and large view switches |
| Suspense | Each panel is its own Suspense and error boundary, so a slow or failed panel never blocks the shell |
| Optimistic updates | Renames, moves, deletes and saves update the store first and roll back on failure ([state-management.md](../architecture/state-management.md#services-write-through-and-optimistic-updates)) |
| Network | Proxy streams upstream bodies with a size cap; client cancels abort the upstream request |
| Assets | SVG illustrations inline and tree-shaken; Lucide icons imported individually |

## Measuring

- `@next/bundle-analyzer` behind `ANALYZE=true pnpm build`.
- React Profiler and the Performance panel for interaction work; findings that change code get a short note in the PR.
- `performance.mark` around send → render and tab switch, read by E2E tests.
