import * as z from "zod/mini";

import { idSchema, isoDateTimeSchema, nameSchema } from "./primitives.schema";
import { requestDefinitionSchema } from "./request.schema";

/**
 * The editable working copy of a request in an open tab (glossary: Draft). It is saved
 * continuously (F-25) and differs from the saved request until the user saves.
 * `baseUpdatedAt` is the `updatedAt` of the saved version the draft started from, so a change
 * made elsewhere is noticed instead of overwritten; it is `null` for a request never saved.
 */
export const requestDraftSchema = z.object({
  tabId: idSchema<"TabId">(),
  workspaceId: idSchema<"WorkspaceId">(),
  baseUpdatedAt: z.nullable(isoDateTimeSchema),
  name: nameSchema,
  request: requestDefinitionSchema,
});

export type RequestDraft = z.infer<typeof requestDraftSchema>;
