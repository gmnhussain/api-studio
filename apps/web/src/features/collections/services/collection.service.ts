import {
  asId,
  childrenOf,
  createCollection as buildCollection,
  createFolderItem,
  createRequestItem,
  currentTimestamp,
  descendantIds,
  duplicateSubtree,
  err,
  nameSchema,
  ok,
  sortKeyAfterLast,
  sortKeyAtIndex,
  sortKeyBetween,
  validateMove,
  type Collection,
  type CollectionId,
  type CollectionItem,
  type CollectionItemId,
  type HttpRequestDefinition,
  type IsoDateTime,
  type Result,
  type WorkspaceId,
} from "@api-studio/core";

import type { ChangeFeed } from "@/lib/db/change-feed";
import { runOptimisticWrite } from "@/lib/services/optimistic-write";

import type { CollectionError } from "../collections.constants";
import type { CollectionRepository } from "../repositories/collection.repository";
import type { CollectionActions, CollectionState } from "../stores/collection.store";

/** Everything the service needs, injected so tests can use a real database and a fresh store. */
export type CollectionServiceDependencies = {
  repository: CollectionRepository;
  store: { getState: () => CollectionState & CollectionActions };
  changeFeed?: ChangeFeed;
  now?: () => IsoDateTime;
};

/** What a new item is and where it goes. */
export type NewItem = {
  collectionId: CollectionId;
  parentId: CollectionItemId | null;
  name: string;
} & ({ type: "folder" } | { type: "request"; request?: HttpRequestDefinition });

type Outcome<Value> = Promise<Result<Value, CollectionError>>;

export type CollectionService = ReturnType<typeof createCollectionService>;

/**
 * Collection and item use cases. Every change is optimistic: the store updates first, IndexedDB
 * second, and a failed write rolls back. Tree rules (ordering, moves, duplication) come from
 * `@api-studio/core`; expected failures are returned as a {@link CollectionError}.
 */
export function createCollectionService({
  repository,
  store,
  changeFeed,
  now = currentTimestamp,
}: CollectionServiceDependencies) {
  const state = () => store.getState();
  const allItems = () => Object.values(state().items);
  const parseName = (name: string) => {
    const result = nameSchema.safeParse(name);
    return result.success ? result.data : null;
  };

  /** Writes items optimistically, restoring the previous versions (or removing new ones) on failure. */
  const writeItems = async (next: readonly CollectionItem[]): Outcome<null> => {
    const previous = next.map((item) => state().items[item.id]);
    return runOptimisticWrite({
      apply: () => {
        state().upsertItems(next);
      },
      persist: () => repository.items.bulkPut(next),
      rollback: () => {
        const restored = previous.filter((item): item is CollectionItem => item !== undefined);
        state().removeItems(next.filter((_, index) => !previous[index]).map((item) => item.id));
        state().upsertItems(restored);
      },
    });
  };

  return {
    /** Loads the collections and items of a workspace into the store. */
    loadCollections: async (workspaceId: WorkspaceId): Outcome<null> => {
      state().startLoading(workspaceId);
      try {
        const { collections, items } = await repository.loadWorkspace(workspaceId);
        if (state().workspaceId === workspaceId) state().setLoaded(collections, items);
        return ok(null);
      } catch {
        state().setFailed();
        return err("storage");
      }
    },

    /** Creates an empty collection at the end of the list. */
    createCollection: async (name: string): Outcome<Collection> => {
      const { workspaceId } = state();
      if (!workspaceId) return err("no_workspace");
      const validName = parseName(name);
      if (validName === null) return err("invalid_name");
      const collection = buildCollection({
        workspaceId,
        name: validName,
        sortKey: sortKeyAfterLast(Object.values(state().collections)),
        now: now(),
      });
      const result = await runOptimisticWrite({
        apply: () => {
          state().upsertCollection(collection);
        },
        persist: () => repository.collections.put(collection),
        rollback: () => {
          state().removeCollection(collection.id);
        },
      });
      return result.ok ? ok(collection) : result;
    },

    /** Renames a collection. */
    renameCollection: async (collectionId: CollectionId, name: string): Outcome<Collection> => {
      const previous = state().collections[collectionId];
      if (!previous) return err("not_found");
      const validName = parseName(name);
      if (validName === null) return err("invalid_name");
      const renamed = { ...previous, name: validName, updatedAt: now() };
      const result = await runOptimisticWrite({
        apply: () => {
          state().upsertCollection(renamed);
        },
        persist: () => repository.collections.put(renamed),
        rollback: () => {
          state().upsertCollection(previous);
        },
      });
      return result.ok ? ok(renamed) : result;
    },

    /** Deletes a collection with all its items. */
    deleteCollection: async (collectionId: CollectionId): Outcome<null> => {
      const previous = state().collections[collectionId];
      if (!previous) return err("not_found");
      const previousItems = allItems().filter((item) => item.collectionId === collectionId);
      return runOptimisticWrite({
        apply: () => {
          state().removeCollection(collectionId);
        },
        persist: () => repository.deleteCollection(collectionId),
        rollback: () => {
          state().upsertCollection(previous);
          state().upsertItems(previousItems);
        },
      });
    },

    /** Creates a folder or request at the end of its parent. */
    createItem: async (newItem: NewItem): Outcome<CollectionItem> => {
      if (!state().collections[newItem.collectionId]) return err("not_found");
      const validName = parseName(newItem.name);
      if (validName === null) return err("invalid_name");
      if (newItem.parentId !== null) {
        const parent = state().items[newItem.parentId];
        if (!parent || parent.collectionId !== newItem.collectionId) return err("not_found");
        if (parent.type !== "folder") return err("invalid_move");
      }
      const placement = {
        collectionId: newItem.collectionId,
        parentId: newItem.parentId,
        sortKey: sortKeyAfterLast(childrenOf(allItems(), newItem.collectionId, newItem.parentId)),
        name: validName,
        now: now(),
      };
      const item: CollectionItem =
        newItem.type === "folder"
          ? createFolderItem(placement)
          : createRequestItem({
              ...placement,
              ...(newItem.request ? { request: newItem.request } : {}),
            });
      const result = await writeItems([item]);
      return result.ok ? ok(item) : result;
    },

    /** Renames a folder or request. */
    renameItem: async (itemId: CollectionItemId, name: string): Outcome<CollectionItem> => {
      const previous = state().items[itemId];
      if (!previous) return err("not_found");
      const validName = parseName(name);
      if (validName === null) return err("invalid_name");
      const renamed = { ...previous, name: validName, updatedAt: now() };
      const result = await writeItems([renamed]);
      return result.ok ? ok(renamed) : result;
    },

    /** Moves an item under `parentId` (`null` for the root) to position `index` among its siblings. */
    moveItem: async (
      itemId: CollectionItemId,
      parentId: CollectionItemId | null,
      index: number,
    ): Outcome<CollectionItem> => {
      const previous = state().items[itemId];
      if (!previous) return err("not_found");
      const invalid = validateMove(allItems(), itemId, parentId);
      if (invalid) return err(invalid === "not_found" ? "not_found" : "invalid_move");
      const siblings = childrenOf(allItems(), previous.collectionId, parentId);
      const moved = {
        ...previous,
        parentId,
        sortKey: sortKeyAtIndex(siblings, index, itemId),
        updatedAt: now(),
      };
      const result = await writeItems([moved]);
      return result.ok ? ok(moved) : result;
    },

    /** Duplicates an item (with everything below it) right after the original. */
    duplicateItem: async (itemId: CollectionItemId, copyName: string): Outcome<CollectionItem> => {
      const original = state().items[itemId];
      if (!original) return err("not_found");
      const validName = parseName(copyName);
      if (validName === null) return err("invalid_name");
      const siblings = childrenOf(allItems(), original.collectionId, original.parentId);
      const next = siblings[siblings.findIndex((sibling) => sibling.id === itemId) + 1];
      const copies = duplicateSubtree(allItems(), itemId, {
        name: validName,
        sortKey: sortKeyBetween(original.sortKey, next?.sortKey ?? null),
        now: now(),
      });
      const [copy] = copies;
      if (!copy) return err("not_found");
      const result = await writeItems(copies);
      return result.ok ? ok(copy) : result;
    },

    /** Deletes an item and everything below it. */
    deleteItem: async (itemId: CollectionItemId): Outcome<null> => {
      const item = state().items[itemId];
      if (!item) return err("not_found");
      const ids = [itemId, ...descendantIds(allItems(), itemId)];
      const previous = ids
        .map((id) => state().items[id])
        .filter((entry): entry is CollectionItem => entry !== undefined);
      return runOptimisticWrite({
        apply: () => {
          state().removeItems(ids);
        },
        persist: () => repository.items.bulkDelete(ids),
        rollback: () => {
          state().upsertItems(previous);
        },
      });
    },

    /** Re-reads collections and items other tabs changed; returns a function that stops listening. */
    syncWithOtherTabs: (): (() => void) => {
      if (!changeFeed) return () => undefined;
      return changeFeed.subscribe((change) => {
        if (change.table === "collections") {
          for (const changedId of change.ids) {
            const id = asId<"CollectionId">(changedId);
            void repository.collections.get(id).then((collection) => {
              if (!collection) state().removeCollection(id);
              else if (collection.workspaceId === state().workspaceId)
                state().upsertCollection(collection);
            });
          }
        }
        if (change.table === "collectionItems") {
          for (const changedId of change.ids) {
            const id = asId<"CollectionItemId">(changedId);
            void repository.items.get(id).then((item) => {
              if (!item) state().removeItems([id]);
              else if (state().collections[item.collectionId]) state().upsertItems([item]);
            });
          }
        }
      });
    },
  };
}
