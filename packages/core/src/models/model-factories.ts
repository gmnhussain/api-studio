import type { Collection, FolderItem, RequestItem } from "./collection.schema";
import type { Environment, EnvironmentColor } from "./environment.schema";
import type { KeyValueEntry, Variable } from "./key-value-entry.schema";
import { DEFAULT_MAX_REDIRECTS, DEFAULT_TIMEOUT_MILLISECONDS } from "./models.constants";
import type { IsoDateTime } from "./primitives.schema";
import type { HttpRequestDefinition, RequestSettings } from "./request.schema";
import type { Workspace } from "./workspace.schema";
import { createId, type CollectionId, type CollectionItemId, type WorkspaceId } from "../ids/ids";
import type { SortKey } from "../ordering/sort-key";

/**
 * Factories for new domain records with sensible defaults (data-model.md). Every result is valid
 * against its schema, so the app and tests build records the same way. `now` is injectable to
 * keep tests deterministic.
 */

/** The current time as an ISO 8601 UTC timestamp. */
export function currentTimestamp(): IsoDateTime {
  return new Date().toISOString();
}

/** Settings a new request starts with. */
export const DEFAULT_REQUEST_SETTINGS: RequestSettings = {
  timeoutMilliseconds: DEFAULT_TIMEOUT_MILLISECONDS,
  followRedirects: true,
  maxRedirects: DEFAULT_MAX_REDIRECTS,
};

/** A new, enabled, empty table row. */
export function createKeyValueEntry(
  fields: Partial<Omit<KeyValueEntry, "id">> = {},
): KeyValueEntry {
  return {
    id: createId<"EntryId">(),
    key: "",
    value: "",
    enabled: true,
    description: "",
    ...fields,
  };
}

/** A new, enabled, non-secret variable. */
export function createVariable(fields: Partial<Omit<Variable, "id">> = {}): Variable {
  return { ...createKeyValueEntry(), isSecret: false, ...fields };
}

/** A new `GET` request with no URL, inheriting auth, without a body. */
export function createHttpRequestDefinition(
  fields: Partial<Omit<HttpRequestDefinition, "protocol">> = {},
): HttpRequestDefinition {
  return {
    protocol: "http",
    method: "GET",
    url: "",
    queryParameters: [],
    pathVariables: [],
    headers: [],
    cookies: [],
    auth: { type: "inherit" },
    body: { type: "none" },
    settings: DEFAULT_REQUEST_SETTINGS,
    description: "",
    ...fields,
  };
}

/** A new workspace with no active environment. */
export function createWorkspace({
  name,
  now = currentTimestamp(),
}: {
  name: string;
  now?: IsoDateTime;
}): Workspace {
  return {
    id: createId<"WorkspaceId">(),
    name,
    activeEnvironmentId: null,
    globalVariables: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** A new, empty collection that sends no auth by default. */
export function createCollection({
  workspaceId,
  name,
  sortKey,
  now = currentTimestamp(),
}: {
  workspaceId: WorkspaceId;
  name: string;
  sortKey: SortKey;
  now?: IsoDateTime;
}): Collection {
  return {
    id: createId<"CollectionId">(),
    workspaceId,
    name,
    description: "",
    auth: { type: "none" },
    variables: [],
    sortKey,
    createdAt: now,
    updatedAt: now,
  };
}

/** Where a new collection item goes: its collection, parent folder (or root) and position. */
export type CollectionItemPlacement = {
  collectionId: CollectionId;
  parentId: CollectionItemId | null;
  sortKey: SortKey;
};

/** A new folder that inherits auth from its parent. */
export function createFolderItem({
  name,
  now = currentTimestamp(),
  ...placement
}: CollectionItemPlacement & { name: string; now?: IsoDateTime }): FolderItem {
  return {
    id: createId<"CollectionItemId">(),
    ...placement,
    type: "folder",
    name,
    auth: { type: "inherit" },
    description: "",
    createdAt: now,
    updatedAt: now,
  };
}

/** A new saved request, by default an empty `GET`. */
export function createRequestItem({
  name,
  request = createHttpRequestDefinition(),
  now = currentTimestamp(),
  ...placement
}: CollectionItemPlacement & {
  name: string;
  request?: HttpRequestDefinition;
  now?: IsoDateTime;
}): RequestItem {
  return {
    id: createId<"CollectionItemId">(),
    ...placement,
    type: "request",
    name,
    request,
    createdAt: now,
    updatedAt: now,
  };
}

/** A new environment without variables. */
export function createEnvironment({
  workspaceId,
  name,
  sortKey,
  color = "neutral",
  now = currentTimestamp(),
}: {
  workspaceId: WorkspaceId;
  name: string;
  sortKey: SortKey;
  color?: EnvironmentColor;
  now?: IsoDateTime;
}): Environment {
  return {
    id: createId<"EnvironmentId">(),
    workspaceId,
    name,
    color,
    variables: [],
    sortKey,
    createdAt: now,
    updatedAt: now,
  };
}
