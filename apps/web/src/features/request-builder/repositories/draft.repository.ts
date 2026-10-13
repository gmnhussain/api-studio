import { requestDraftSchema, type RequestDraft } from "@api-studio/core";

import type { ApiStudioDatabase } from "@/lib/db/database";
import {
  createTableRepository,
  type InvalidRecordReporter,
  type TableRepository,
} from "@/lib/db/table-repository";

/**
 * Persistence for drafts, keyed by the tab that edits them. Drafts belong to one browser window's
 * tabs, so they are not broadcast to other tabs.
 */
export type DraftRepository = TableRepository<RequestDraft, "tabId">;

/** Creates the IndexedDB-backed {@link DraftRepository}. */
export function createDraftRepository(
  database: ApiStudioDatabase,
  { onInvalidRecord }: { onInvalidRecord?: InvalidRecordReporter } = {},
): DraftRepository {
  return createTableRepository({
    tableName: "drafts",
    key: "tabId",
    table: database.drafts,
    schema: requestDraftSchema,
    onInvalidRecord,
  });
}
