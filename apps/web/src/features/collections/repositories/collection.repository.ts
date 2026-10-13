import {
  collectionItemSchema,
  collectionSchema,
  type Collection,
  type CollectionId,
  type CollectionItem,
  type CollectionItemId,
  type WorkspaceId,
} from "@api-studio/core";

import type { ChangeFeed } from "@/lib/db/change-feed";
import type { ApiStudioDatabase } from "@/lib/db/database";
import {
  createTableRepository,
  type InvalidRecordReporter,
  type TableRepository,
} from "@/lib/db/table-repository";

/** Persistence for collections and their items. */
export type CollectionRepository = {
  collections: TableRepository<Collection>;
  items: TableRepository<CollectionItem>;
  /** Every collection of a workspace with all of their items. */
  loadWorkspace: (
    workspaceId: WorkspaceId,
  ) => Promise<{ collections: Collection[]; items: CollectionItem[] }>;
  /** Deletes a collection and all its items in one transaction. */
  deleteCollection: (collectionId: CollectionId) => Promise<void>;
};

/** Options for {@link createCollectionRepository}. */
export type CollectionRepositoryOptions = {
  changeFeed?: ChangeFeed;
  onInvalidRecord?: InvalidRecordReporter;
};

/** Creates the IndexedDB-backed {@link CollectionRepository}. */
export function createCollectionRepository(
  database: ApiStudioDatabase,
  { changeFeed, onInvalidRecord }: CollectionRepositoryOptions = {},
): CollectionRepository {
  const collections = createTableRepository({
    tableName: "collections",
    key: "id",
    table: database.collections,
    schema: collectionSchema,
    changeFeed,
    onInvalidRecord,
  });
  const items = createTableRepository({
    tableName: "collectionItems",
    key: "id",
    table: database.collectionItems,
    schema: collectionItemSchema,
    changeFeed,
    onInvalidRecord,
  });

  return {
    collections,
    items,
    loadWorkspace: async (workspaceId) => {
      const workspaceCollections = await collections.findBy("workspaceId", workspaceId);
      const workspaceItems = await items.findByAnyOf(
        "collectionId",
        workspaceCollections.map((collection) => collection.id),
      );
      return { collections: workspaceCollections, items: workspaceItems };
    },
    deleteCollection: async (collectionId) => {
      let itemIds: CollectionItemId[] = [];
      await database.transaction(
        "rw",
        [database.collections, database.collectionItems],
        async () => {
          itemIds = await database.collectionItems
            .where("collectionId")
            .equals(collectionId)
            .primaryKeys();
          await database.collectionItems.bulkDelete(itemIds);
          await database.collections.delete(collectionId);
        },
      );
      changeFeed?.publish({ table: "collections", ids: [collectionId] });
      if (itemIds.length > 0) changeFeed?.publish({ table: "collectionItems", ids: itemIds });
    },
  };
}
