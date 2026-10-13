import { create } from "zustand";

import type {
  Collection,
  CollectionId,
  CollectionItem,
  CollectionItemId,
  WorkspaceId,
} from "@api-studio/core";

/** Where loading the active workspace's collections stands. */
export type CollectionLoadStatus = "idle" | "loading" | "ready" | "failed";

export type CollectionState = {
  /** The workspace whose collections are loaded. */
  workspaceId: WorkspaceId | null;
  status: CollectionLoadStatus;
  /** Collections by id. */
  collections: Readonly<Record<CollectionId, Collection>>;
  /** Items of every loaded collection by id, stored flat (data-model.md#conventions). */
  items: Readonly<Record<CollectionItemId, CollectionItem>>;
};

export type CollectionActions = {
  startLoading: (workspaceId: WorkspaceId) => void;
  setLoaded: (collections: readonly Collection[], items: readonly CollectionItem[]) => void;
  setFailed: () => void;
  upsertCollection: (collection: Collection) => void;
  removeCollection: (collectionId: CollectionId) => void;
  upsertItems: (items: readonly CollectionItem[]) => void;
  removeItems: (itemIds: readonly CollectionItemId[]) => void;
};

function byId<Entity extends { id: string }>(entities: readonly Entity[]): Record<string, Entity> {
  return Object.fromEntries(entities.map((entity) => [entity.id, entity]));
}

function without<Entity>(
  record: Readonly<Record<string, Entity>>,
  ids: readonly string[],
): Record<string, Entity> {
  const excluded = new Set(ids);
  return Object.fromEntries(Object.entries(record).filter(([id]) => !excluded.has(id)));
}

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialCollectionState(): CollectionState {
  return { workspaceId: null, status: "idle", collections: {}, items: {} };
}

/**
 * The active workspace's collections and items, normalized by id so a rename or move rewrites
 * one entry (ADR-0004). IndexedDB is the source of truth; the collection service writes through.
 */
export const useCollectionStore = create<CollectionState & CollectionActions>()((set) => ({
  ...getInitialCollectionState(),
  startLoading: (workspaceId) => {
    set({ workspaceId, status: "loading", collections: {}, items: {} });
  },
  setLoaded: (collections, items) => {
    set({ status: "ready", collections: byId(collections), items: byId(items) });
  },
  setFailed: () => {
    set({ status: "failed" });
  },
  upsertCollection: (collection) => {
    set((state) => ({ collections: { ...state.collections, [collection.id]: collection } }));
  },
  removeCollection: (collectionId) => {
    set((state) => {
      const itemIds = Object.values(state.items)
        .filter((item) => item.collectionId === collectionId)
        .map((item) => item.id);
      return {
        collections: without(state.collections, [collectionId]),
        items: without(state.items, itemIds),
      };
    });
  },
  upsertItems: (items) => {
    set((state) => ({ items: { ...state.items, ...byId(items) } }));
  },
  removeItems: (itemIds) => {
    set((state) => ({ items: without(state.items, itemIds) }));
  },
}));
