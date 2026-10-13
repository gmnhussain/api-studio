import { environmentSchema, type Environment } from "@api-studio/core";

import type { ChangeFeed } from "@/lib/db/change-feed";
import type { ApiStudioDatabase } from "@/lib/db/database";
import {
  createTableRepository,
  type InvalidRecordReporter,
  type TableRepository,
} from "@/lib/db/table-repository";

/** Persistence for environments. */
export type EnvironmentRepository = TableRepository<Environment>;

/** Creates the IndexedDB-backed {@link EnvironmentRepository}. */
export function createEnvironmentRepository(
  database: ApiStudioDatabase,
  options: { changeFeed?: ChangeFeed; onInvalidRecord?: InvalidRecordReporter } = {},
): EnvironmentRepository {
  return createTableRepository({
    tableName: "environments",
    key: "id",
    table: database.environments,
    schema: environmentSchema,
    ...options,
  });
}
