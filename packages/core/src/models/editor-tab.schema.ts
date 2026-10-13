import * as z from "zod/mini";

import { RECENTLY_CLOSED_TABS_LIMIT, TAB_KINDS } from "./models.constants";
import { idSchema, isoDateTimeSchema } from "./primitives.schema";

/**
 * An open editor in the centre area (glossary: Tab). `entityId` names what it shows: a saved
 * request's item id, an environment id or a collection id; `null` is a request not saved yet.
 */
export const editorTabSchema = z.object({
  id: idSchema<"TabId">(),
  workspaceId: idSchema<"WorkspaceId">(),
  kind: z.enum(TAB_KINDS),
  entityId: z.nullable(z.string().check(z.minLength(1))),
  isPinned: z.boolean(),
  openedAt: isoDateTimeSchema,
});

export type EditorTab = z.infer<typeof editorTabSchema>;

/** The `kind` of an {@link EditorTab}. */
export type TabKind = EditorTab["kind"];

/**
 * The open tabs of one workspace, restored after a reload (F-24): their order (pinned first),
 * the active one and the recently closed ones, newest first.
 */
export const tabLayoutSchema = z.object({
  workspaceId: idSchema<"WorkspaceId">(),
  tabs: z.array(editorTabSchema),
  activeTabId: z.nullable(idSchema<"TabId">()),
  recentlyClosed: z.array(editorTabSchema).check(z.maxLength(RECENTLY_CLOSED_TABS_LIMIT)),
  updatedAt: isoDateTimeSchema,
});

export type TabLayout = z.infer<typeof tabLayoutSchema>;
