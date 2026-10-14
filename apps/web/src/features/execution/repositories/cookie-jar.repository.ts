import { cookieJarSchema, type CookieJar } from "@api-studio/core";

import type { ApiStudioDatabase } from "@/lib/db/database";
import {
  createTableRepository,
  type InvalidRecordReporter,
  type TableRepository,
} from "@/lib/db/table-repository";

/** Persistence for each workspace's cookie jar, one record per workspace. */
export type CookieJarRepository = TableRepository<CookieJar, "workspaceId">;

/** Creates the IndexedDB-backed {@link CookieJarRepository}. */
export function createCookieJarRepository(
  database: ApiStudioDatabase,
  { onInvalidRecord }: { onInvalidRecord?: InvalidRecordReporter } = {},
): CookieJarRepository {
  return createTableRepository({
    tableName: "cookieJars",
    key: "workspaceId",
    table: database.cookieJars,
    schema: cookieJarSchema,
    onInvalidRecord,
  });
}
