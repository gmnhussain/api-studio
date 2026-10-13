import { workspaceSchema, type Workspace, type WorkspaceId } from "@api-studio/core";

import type { ChangeFeed } from "@/lib/db/change-feed";
import type { ApiStudioDatabase } from "@/lib/db/database";
import {
  createTableRepository,
  type InvalidRecordReporter,
  type TableRepository,
} from "@/lib/db/table-repository";

/** Persistence for workspaces. */
export type WorkspaceRepository = TableRepository<Workspace> & {
  /**
   * Deletes a workspace with everything in it (collections, their items, environments, open tabs
   * and their drafts) in one transaction, so a failure never leaves orphaned records.
   */
  deleteWithContents: (workspaceId: WorkspaceId) => Promise<void>;
};

/** Options for {@link createWorkspaceRepository}. */
export type WorkspaceRepositoryOptions = {
  changeFeed?: ChangeFeed;
  onInvalidRecord?: InvalidRecordReporter;
};

/** Creates the IndexedDB-backed {@link WorkspaceRepository}. */
export function createWorkspaceRepository(
  database: ApiStudioDatabase,
  { changeFeed, onInvalidRecord }: WorkspaceRepositoryOptions = {},
): WorkspaceRepository {
  const repository = createTableRepository({
    tableName: "workspaces",
    key: "id",
    table: database.workspaces,
    schema: workspaceSchema,
    changeFeed,
    onInvalidRecord,
  });

  return {
    ...repository,
    deleteWithContents: async (workspaceId) => {
      const tables = [
        database.workspaces,
        database.collections,
        database.collectionItems,
        database.environments,
        database.drafts,
        database.tabLayouts,
      ];
      await database.transaction("rw", tables, async () => {
        const collectionIds = await database.collections
          .where("workspaceId")
          .equals(workspaceId)
          .primaryKeys();
        await database.collectionItems.where("collectionId").anyOf(collectionIds).delete();
        await database.collections.bulkDelete(collectionIds);
        await database.environments.where("workspaceId").equals(workspaceId).delete();
        await database.drafts.where("workspaceId").equals(workspaceId).delete();
        await database.tabLayouts.delete(workspaceId);
        await database.workspaces.delete(workspaceId);
      });
      changeFeed?.publish({ table: "workspaces", ids: [workspaceId] });
    },
  };
}
