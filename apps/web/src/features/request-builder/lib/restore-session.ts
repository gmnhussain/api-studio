import {
  asId,
  type CollectionItem,
  type CollectionItemId,
  type EditorTab,
  type RequestDraft,
  type TabId,
  type TabLayout,
} from "@api-studio/core";

import { asRequestItem, draftFromSaved, isDraftDirty } from "./draft-status";

/** What a workspace's tabs and drafts look like once checked against its saved requests. */
export type RestoredSession = {
  tabs: EditorTab[];
  activeTabId: TabLayout["activeTabId"];
  recentlyClosed: EditorTab[];
  drafts: RequestDraft[];
  /** Drafts that changed while restoring and must be written back. */
  changedDrafts: RequestDraft[];
  /** Stored drafts no open tab uses any more. */
  orphanedDraftIds: TabId[];
};

/** The saved request a request tab shows, if it still exists. */
export function savedRequestOf(
  tab: EditorTab,
  items: Readonly<Record<CollectionItemId, CollectionItem>>,
) {
  return tab.entityId === null
    ? undefined
    : asRequestItem(items[asId<"CollectionItemId">(tab.entityId)]);
}

/**
 * Reconciles a restored tab layout and its drafts with the saved requests (F-24), so every open
 * request tab has a draft that agrees with what is saved:
 *
 * - a tab whose draft is missing starts a fresh draft from its saved request, or closes when there
 *   is neither;
 * - a tab whose saved request was deleted keeps its draft as a new, unsaved request;
 * - a clean draft whose request was saved elsewhere since follows the saved version;
 * - drafts without a tab are dropped.
 *
 * Tabs of other kinds are kept as they are.
 */
export function restoreSession({
  layout,
  drafts,
  items,
}: {
  layout: Pick<TabLayout, "tabs" | "activeTabId" | "recentlyClosed">;
  drafts: readonly RequestDraft[];
  items: Readonly<Record<CollectionItemId, CollectionItem>>;
}): RestoredSession {
  const draftsByTab = new Map(drafts.map((draft) => [draft.tabId, draft]));
  const tabs: EditorTab[] = [];
  const restoredDrafts: RequestDraft[] = [];
  const changedDrafts: RequestDraft[] = [];

  for (const tab of layout.tabs) {
    if (tab.kind !== "request") {
      tabs.push(tab);
      continue;
    }
    const draft = draftsByTab.get(tab.id);
    const saved = savedRequestOf(tab, items);

    if (!draft) {
      if (!saved) continue;
      const fresh = draftFromSaved(
        {
          tabId: tab.id,
          workspaceId: tab.workspaceId,
          baseUpdatedAt: null,
          name: saved.name,
          request: saved.request,
        },
        saved,
      );
      tabs.push(tab);
      restoredDrafts.push(fresh);
      changedDrafts.push(fresh);
      continue;
    }

    if (tab.entityId !== null && !saved) {
      const unsaved = { ...draft, baseUpdatedAt: null };
      tabs.push({ ...tab, entityId: null });
      restoredDrafts.push(unsaved);
      changedDrafts.push(unsaved);
      continue;
    }

    if (saved && draft.baseUpdatedAt !== saved.updatedAt && !isDraftDirty(draft, saved)) {
      const followed = draftFromSaved(draft, saved);
      restoredDrafts.push(followed);
      changedDrafts.push(followed);
    } else {
      restoredDrafts.push(draft);
    }
    tabs.push(tab);
  }

  const openTabIds = new Set(tabs.map((tab) => tab.id));
  return {
    tabs,
    activeTabId: layout.activeTabId,
    recentlyClosed: layout.recentlyClosed,
    drafts: restoredDrafts,
    changedDrafts,
    orphanedDraftIds: drafts
      .filter((draft) => !openTabIds.has(draft.tabId))
      .map((draft) => draft.tabId),
  };
}
