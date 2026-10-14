# Data Model

**All domain types live in `@api-studio/core/models`, each defined once as a Zod schema with its type inferred (`z.infer`). Persisted and imported data is always parsed through these schemas.**

The snippets below are the design contract, not final code.

## Conventions

| Topic | Rule |
| --- | --- |
| Ids | Branded strings: `type RequestId = string & { readonly __brand: "RequestId" }`. Created only by factories in `core/ids` (UUID v7, time-sortable) |
| Timestamps | ISO 8601 UTC strings (`createdAt`, `updatedAt`); formatted with date-fns at the edge |
| Unions | Discriminated by `type` (or `protocol` for requests). Every `switch` is exhaustive (lint-enforced) |
| Ordering | Siblings carry a fractional-index `sortKey` string, so a drag-and-drop move rewrites one record, not the whole list |
| Trees | Stored flat and normalized (`parentId`), assembled into a tree by selectors |
| Optional vs empty | Lists default to `[]`, never `undefined` |
| Versioning | IndexedDB is versioned as a whole: each schema change is a new Dexie version with an upgrade function, and every record is parsed with its schema on read. Exported documents carry `schemaVersion`, migrated by pure functions `vN → vN+1` on import |

## Entity map

```text
Workspace 1─* Collection 1─* CollectionItem (FolderItem | RequestItem) 1─* SavedResponse
Workspace 1─* Environment 1─* Variable
Workspace 1─* HistoryEntry ─1 ResponseSnapshot (body stored separately)
Workspace 1─* EditorTab ─1 RequestDraft
Workspace 1─1 CookieJar
```

## Shared building blocks

```ts
type KeyValueEntry = {
  id: EntryId;
  key: string;
  value: string;
  enabled: boolean;
  description: string;
};

type Variable = KeyValueEntry & { isSecret: boolean };

type VariableScope = "global" | "collection" | "environment";
```

## Workspace

```ts
type Workspace = {
  id: WorkspaceId;
  name: string;
  activeEnvironmentId: EnvironmentId | null;
  globalVariables: Variable[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};
```

## Collections and items

```ts
type Collection = {
  id: CollectionId;
  workspaceId: WorkspaceId;
  name: string;
  description: string;
  auth: AuthConfig;              // inherited by items whose auth is { type: "inherit" }
  variables: Variable[];
  sortKey: SortKey;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

type CollectionItemBase = {
  id: CollectionItemId;
  collectionId: CollectionId;
  parentId: CollectionItemId | null;   // null = collection root
  name: string;
  sortKey: SortKey;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

type FolderItem = CollectionItemBase & { type: "folder"; auth: AuthConfig; description: string };

type RequestItem = CollectionItemBase & { type: "request"; request: RequestDefinition };

type CollectionItem = FolderItem | RequestItem;
```

## Requests (protocol-extensible)

`RequestDefinition` is a union over protocols. v1 implements only `http`; adding GraphQL means adding a member and an adapter, nothing else changes ([ADR-0005](./adr/0005-protocol-adapters.md)).

```ts
type RequestDefinition = HttpRequestDefinition; // | GraphqlRequestDefinition | WebSocketRequestDefinition ...

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

type HttpRequestDefinition = {
  protocol: "http";
  method: HttpMethod;
  url: string;                       // raw, may contain {{variables}} and :pathVariables
  queryParameters: KeyValueEntry[];  // kept in sync with url
  pathVariables: KeyValueEntry[];    // derived keys, user values
  headers: KeyValueEntry[];
  cookies: KeyValueEntry[];          // manual cookies, merged with the cookie jar
  auth: AuthConfig;
  body: RequestBody;
  settings: RequestSettings;
  description: string;
};

type RequestSettings = {
  timeoutMilliseconds: number;
  followRedirects: boolean;
  maxRedirects: number;
};
```

### Auth

```ts
type AuthConfig =
  | { type: "none" }
  | { type: "inherit" }
  | { type: "basic"; username: string; password: string }
  | { type: "bearer"; token: string; prefix: string }                 // prefix defaults to "Bearer"
  | { type: "api_key"; key: string; value: string; placement: "header" | "query" }
  | { type: "oauth2"; grantType: OAuth2GrantType; accessTokenUrl: string; clientId: string;
      clientSecret: string; scope: string; accessToken: string };     // flow not implemented in v1
```

Auth schemes register in the auth registry; each provides its form component and a pure `apply(request, auth) → request` function in core.

### Body

```ts
type RequestBody =
  | { type: "none" }
  | { type: "json"; text: string }
  | { type: "text"; text: string }
  | { type: "xml"; text: string }
  | { type: "form_data"; entries: FormDataEntry[] }   // text entries in v1; file entries later
  | { type: "url_encoded"; entries: KeyValueEntry[] }
  | { type: "binary"; fileName: string | null };      // placeholder in v1
```

The body type decides the default `Content-Type`, shown as an auto-generated (read-only, overridable) header.

## Drafts and tabs

```ts
type TabKind = "request" | "environment" | "collection";

type EditorTab = {
  id: TabId;
  workspaceId: WorkspaceId;
  kind: TabKind;
  entityId: string | null;           // null = an unsaved new request
  isPinned: boolean;
  openedAt: IsoDateTime;
};

type RequestDraft = {
  tabId: TabId;
  workspaceId: WorkspaceId;          // so deleting a workspace deletes its drafts
  baseUpdatedAt: IsoDateTime | null; // saved version the draft started from (conflict detection)
  request: RequestDefinition;
  name: string;
};

type TabLayout = {                   // one per workspace: what reopens after a reload (F-24)
  workspaceId: WorkspaceId;
  tabs: EditorTab[];                 // strip order, pinned first
  activeTabId: TabId | null;
  recentlyClosed: EditorTab[];       // newest first, at most 20; only tabs of saved requests
  updatedAt: IsoDateTime;
};
```

`isDirty` is derived (draft differs from saved), never stored. On restore, every request tab is checked against its saved request: a missing draft starts from the saved request, a clean draft follows a version saved elsewhere, an edited one keeps its changes and shows a conflict notice, and a tab whose request was deleted becomes an unsaved request.

## Environments

```ts
type Environment = {
  id: EnvironmentId;
  workspaceId: WorkspaceId;
  name: string;
  color: EnvironmentColor;           // token name, e.g. "green" | "amber" | "red"
  variables: Variable[];
  sortKey: SortKey;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};
```

**Resolution order** (later wins): workspace globals → collection variables → active environment. Unresolved `{{name}}` stays literal, is highlighted as an error in the editor and reported in the console.

## Execution and response

```ts
type ResolvedRequest = {             // what is actually sent — no variables, auth applied
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];             // ordered, duplicates allowed
  body: SerializedBody;              // text | base64 | form parts
};

type ResponseSnapshot = {
  status: number;
  statusText: string;
  headers: HeaderPair[];
  cookies: ResponseCookie[];
  body: ResponseBody;                // { encoding: "text" | "base64"; data; contentType; truncated }
  sizes: { requestBytes: number; responseHeadersBytes: number; responseBodyBytes: number };
  timings: ExecutionTimings;         // startedAt, timeToFirstByteMs, downloadMs, totalMs
  redirects: RedirectHop[];          // { status, url, location }
  httpVersion: string;
};

type ExecutionError = {
  code: "TIMEOUT" | "ABORTED" | "NETWORK" | "DNS" | "TLS" | "BLOCKED_ADDRESS" |
        "TOO_MANY_REDIRECTS" | "RESPONSE_TOO_LARGE" | "INVALID_REQUEST" | "UNRESOLVED_VARIABLES";
  message: string;
};

type ExecutionResult =
  | { outcome: "response"; request: ResolvedRequest; response: ResponseSnapshot }
  | { outcome: "error"; request: ResolvedRequest | null; error: ExecutionError };
```

## History and saved responses

```ts
type HistoryEntry = {
  id: HistoryEntryId;
  workspaceId: WorkspaceId;
  sourceItemId: CollectionItemId | null;
  request: ResolvedRequest;           // secrets redacted
  summary: { status: number | null; totalMs: number; responseBytes: number; errorCode: string | null };
  responseBodyId: ResponseBodyId | null;  // body in its own table, loaded lazily
  executedAt: IsoDateTime;
};

type SavedResponse = {
  id: SavedResponseId;
  requestItemId: CollectionItemId;
  name: string;
  response: ResponseSnapshot;
  savedAt: IsoDateTime;
};
```

History is capped per workspace (setting, default 500 entries); the oldest entries and their bodies are pruned on write.

## Settings

```ts
type Settings = {
  appearance: { theme: "dark" | "light" | "system"; accent: AccentPreset; density: "comfortable" | "compact";
                uiFontSize: number; reduceMotion: "system" | "always" };
  editor: { fontSize: number; tabSize: 2 | 4; wordWrap: boolean; minimap: boolean };
  requests: { defaultTimeoutMilliseconds: number; followRedirects: boolean; maxRedirects: number;
              executorMode: "proxy" | "browser"; historyLimit: number };
};
```

## Collection document (export format)

```ts
type CollectionDocument = {
  format: "api-studio.collection";   // a JSON Schema is generated from the Zod schema and published with releases
  schemaVersion: 1;
  exportedAt: IsoDateTime;
  collection: Omit<Collection, "workspaceId">;
  items: CollectionItem[];           // flat, parentId-linked, stable order by sortKey
  environments: Environment[];       // optional on export; secret values always emptied
};
```

The JSON is written with stable key order and 2-space indentation so exported collections diff cleanly in git ([ADR-0006](./adr/0006-versioned-collection-format.md)).

## IndexedDB schema (Dexie)

| Table | Since | Key | Indexes |
| --- | --- | --- | --- |
| `workspaces` | v1 (M2) | `id` | — |
| `collections` | v1 (M2) | `id` | `workspaceId` |
| `collectionItems` | v1 (M2) | `id` | `collectionId`, `[collectionId+parentId]` |
| `environments` | v1 (M2) | `id` | `workspaceId` |
| `drafts` | v2 (M3) | `tabId` | `workspaceId` |
| `tabLayouts` | v2 (M3) | `workspaceId` | — |
| `history` | planned (M4) | `id` | `[workspaceId+executedAt]` |
| `responseBodies` | planned (M4) | `id` | — |
| `cookieJars` | planned (M4) | `workspaceId` | — |
| `savedResponses` | planned (M8) | `id` | `requestItemId` |

Versions are declared in one list (`apps/web/src/lib/db/database.ts`); a released version is never edited. Each new version comes with its upgrade function and a test that opens data written by the previous version.
