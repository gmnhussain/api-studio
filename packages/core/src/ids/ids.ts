import { createUuidV7 } from "./uuid-v7";

/**
 * A string that the type system keeps apart from other strings, so a collection id can never be
 * passed where a workspace id is expected (data-model.md#conventions).
 */
export type Brand<Base, Name extends string> = Base & { readonly __brand: Name };

export type WorkspaceId = Brand<string, "WorkspaceId">;
export type CollectionId = Brand<string, "CollectionId">;
export type CollectionItemId = Brand<string, "CollectionItemId">;
export type EnvironmentId = Brand<string, "EnvironmentId">;
export type EntryId = Brand<string, "EntryId">;
export type HistoryEntryId = Brand<string, "HistoryEntryId">;
export type ResponseBodyId = Brand<string, "ResponseBodyId">;
export type SavedResponseId = Brand<string, "SavedResponseId">;
export type TabId = Brand<string, "TabId">;

/** The names of every branded id, for {@link createId}. */
export type IdName =
  | "WorkspaceId"
  | "CollectionId"
  | "CollectionItemId"
  | "EnvironmentId"
  | "EntryId"
  | "HistoryEntryId"
  | "ResponseBodyId"
  | "SavedResponseId"
  | "TabId";

/**
 * Treats an existing string as a branded id. Use only where the string is already known to be
 * such an id: after schema validation, or in tests.
 */
export function asId<Name extends IdName>(value: string): Brand<string, Name> {
  // The one place a string becomes a branded id; callers vouch for the value.
  return value as Brand<string, Name>;
}

/** Creates a new, time-sortable id of the given kind (UUID v7). */
export function createId<Name extends IdName>(): Brand<string, Name> {
  return asId<Name>(createUuidV7());
}
