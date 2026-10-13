import { tabLayoutSchema, type TabLayout } from "@api-studio/core";

import type { ApiStudioDatabase } from "@/lib/db/database";
import {
  createTableRepository,
  type InvalidRecordReporter,
  type TableRepository,
} from "@/lib/db/table-repository";

/**
 * Persistence for each workspace's tab layout, one record per workspace. Layouts are not shared
 * with other browser tabs: each window keeps the tabs it shows.
 */
export type TabLayoutRepository = TableRepository<TabLayout, "workspaceId">;

/** Creates the IndexedDB-backed {@link TabLayoutRepository}. */
export function createTabLayoutRepository(
  database: ApiStudioDatabase,
  { onInvalidRecord }: { onInvalidRecord?: InvalidRecordReporter } = {},
): TabLayoutRepository {
  return createTableRepository({
    tableName: "tabLayouts",
    key: "workspaceId",
    table: database.tabLayouts,
    schema: tabLayoutSchema,
    onInvalidRecord,
  });
}
