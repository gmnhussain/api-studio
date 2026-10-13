# State Management

**One Zustand store per domain, each small and owned by its feature. Stores hold in-memory state and synchronous actions; services handle persistence and side effects. TanStack Query owns async I/O lifecycles. There is no global "app store".**

## Where state lives

| Kind of state | Lives in | Example |
| --- | --- | --- |
| Domain data (local source of truth) | Domain store, written through to IndexedDB by a service | Collections, environments |
| Working copies | Request store | Drafts per tab |
| Async lifecycles | TanStack Query | Running execution, lazily loaded history body |
| UI layout and preferences | `persist` stores in cookies, readable before or during the server render (no flash, no layout shift) | Panel sizes, sidebar section, theme |
| Small client-only lists | `persist` stores in `localStorage` | Tab order |
| Ephemeral component state | `useState` / `useReducer` | An open dropdown, inline rename text |
| Form state | React Hook Form | Settings forms, "new environment" dialog |
| URL state | Next.js route | Active workspace, settings section |

## Stores

| Store | File | Owns | Persistence |
| --- | --- | --- | --- |
| Workspace | `features/workspace/stores/workspace.store.ts` | Workspaces, `activeWorkspaceId` | IndexedDB (service) |
| Collection | `features/collections/stores/collection.store.ts` | Collections + normalized items of the active workspace, expanded folders | IndexedDB (service); expanded state in `localStorage` |
| Request | `features/request-builder/stores/request.store.ts` | Drafts by `tabId`, active editor section per tab | IndexedDB, debounced auto-save |
| Tabs | `features/tabs/stores/tabs.store.ts` | Tab order, active tab, pinned flags, recently closed | `localStorage` (tab restore) |
| History | `features/history/stores/history.store.ts` | Entry summaries (bodies load lazily) | IndexedDB (service) |
| Environment | `features/environments/stores/environment.store.ts` | Environments, active environment | IndexedDB (service) |
| Settings | `features/settings/stores/settings.store.ts` | `Settings` (appearance first; editor and request settings join later) | Cookie, applied before first paint by a boot script ([ADR-0011](./adr/0011-cookie-backed-preferences-and-layout.md)) |
| UI | `features/shell/stores/ui.store.ts` | Active sidebar section, panel layout (sizes and collapsed panels), palette open | Cookie, read by the studio layout on the server ([ADR-0011](./adr/0011-cookie-backed-preferences-and-layout.md)) |
| Console | `features/console/stores/console.store.ts` | Ring buffer of console entries (max 1,000) | Memory only |

The console store is an addition to the original eight: logs change at a different rate and lifetime from everything else, so they get their own store.

## Store shape

Every store follows the same pattern so they read alike:

```ts
type TabsState = { tabs: EditorTab[]; activeTabId: TabId | null };

type TabsActions = {
  openTab: (input: OpenTabInput) => TabId;
  closeTab: (tabId: TabId) => void;
  moveTab: (tabId: TabId, toIndex: number) => void;
  togglePin: (tabId: TabId) => void;
};

export const useTabsStore = create<TabsState & TabsActions>()(
  persist(/* state + actions */, { name: STORAGE_KEYS.tabs, version: 1, migrate: migrateTabsState }),
);
```

Rules:

1. **State is serializable.** No class instances, `AbortController`s, Monaco models or DOM nodes. Non-serializable handles live in module-level registries keyed by id (e.g. the execution registry keyed by `executionId`).
2. **Actions are synchronous and pure state transitions.** I/O goes in services, which call actions.
3. **Components read with selectors** (`useTabsStore((state) => state.activeTabId)`), and `useShallow` for derived objects. Never subscribe to a whole store.
4. **Derived data is computed by selectors** in `<feature>.selectors.ts` (`selectCollectionTree`, `selectIsDraftDirty`), not stored.
5. **Stores never import other stores.** Coordination across domains happens in a service or a hook that reads both.
6. **Persisted stores have a `version` and a `migrate`** function, tested like any other migration.
7. **Tests reset stores** through an exported `getInitialState()`; no test relies on another's state.

## Services: write-through and optimistic updates

A service is the only place that touches both a store and a repository:

```text
renameItem(itemId, name)
  1. previous = store snapshot of the item
  2. store.updateItem(itemId, { name })          ← UI updates immediately (optimistic)
  3. await repository.update(itemId, { name })
  4. on failure: store.updateItem(itemId, previous) + error toast + console entry
```

Delete is optimistic with an **Undo** toast: the item leaves the store at once; the repository delete runs when the toast expires or is dismissed.

## TanStack Query

| Use | Hook |
| --- | --- |
| Execute a request | `useExecuteRequest()` — `useMutation` with an `AbortSignal`, retry on demand, writes history and console on settle |
| Load a history response body | `useQuery(["response-body", id])`, `staleTime: Infinity` (bodies are immutable) |
| Import from a URL (OpenAPI later) | `useMutation` |
| Future cloud sync | Queries over a remote repository |

Query keys come from one factory per feature (`historyQueryKeys.body(id)`), never inline arrays.

## Hydration and first paint

1. Appearance settings come from a cookie that an inline boot script applies to `<html>` before the first paint; the panel layout comes from a cookie the studio layout reads on the server. Both are right on the first frame ([ADR-0011](./adr/0011-cookie-backed-preferences-and-layout.md)). Cookie-backed stores are created per request through a provider, so server renders never share state; the rest are module-level stores.
2. IndexedDB stores hydrate in the studio layout's client boundary; the shell renders immediately with skeletons in the sidebar and editor, which swap to content when hydration resolves (Suspense boundary per panel).
3. Every persisted payload is parsed with its Zod schema; an invalid record is skipped and reported in the console instead of crashing the app.

## Cross-tab consistency

Two browser tabs editing the same workspace: repositories broadcast changes over `BroadcastChannel`; other tabs re-read the affected records. Last write wins per record; a draft whose `baseUpdatedAt` is older than the saved record shows a "changed elsewhere" notice instead of silently overwriting.
