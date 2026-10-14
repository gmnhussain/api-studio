import {
  asId,
  createEditorTab,
  createHttpRequestDefinition,
  err,
  nameSchema,
  ok,
  type CollectionId,
  type CollectionItemId,
  type RequestDraft,
  type RequestItem,
  type Result,
  type TabId,
  type WorkspaceId,
} from "@api-studio/core";

import type {
  CollectionActions,
  CollectionError,
  CollectionService,
  CollectionState,
} from "@/features/collections";
import type { TabsActions, TabsService, TabsState } from "@/features/tabs";
import type { ObservableStore } from "@/lib/services/observable-store";

import { createDraftPersistence } from "./draft-persistence";
import {
  asRequestItem,
  draftFromSaved,
  isDraftDirty,
  matchesSavedRequest,
} from "../lib/draft-status";
import { restoreSession, savedRequestOf } from "../lib/restore-session";
import type { DraftRepository } from "../repositories/draft.repository";
import type { RequestBuilderError } from "../request-builder.constants";
import type { RequestActions, RequestState } from "../stores/request.store";

/** Everything the service needs, injected so tests can use a real database and fresh stores. */
export type RequestServiceDependencies = {
  draftRepository: DraftRepository;
  requestStore: ObservableStore<RequestState & RequestActions>;
  tabsStore: ObservableStore<TabsState & TabsActions>;
  collectionStore: ObservableStore<CollectionState & CollectionActions>;
  tabsService: Pick<TabsService, "readLayout" | "flush">;
  collectionService: Pick<
    CollectionService,
    "loadCollections" | "saveRequest" | "createItem" | "createCollection"
  >;
  /** Called when auto-saving drafts fails; drafts stay in memory and the next edit retries. */
  onSaveFailed?: () => void;
};

/** Where "save as" puts a new request: an existing collection (and folder), or a new collection. */
export type SaveLocation =
  { collectionId: CollectionId; parentId: CollectionItemId | null } | { newCollectionName: string };

type Outcome<Value> = Promise<Result<Value, RequestBuilderError>>;

function fromCollectionError(error: CollectionError): RequestBuilderError {
  switch (error) {
    case "invalid_name":
      return "invalid_name";
    case "not_found":
    case "invalid_move":
      return "not_found";
    case "no_workspace":
    case "storage":
      return "storage";
  }
}

export type RequestService = ReturnType<typeof createRequestService>;

/**
 * Request tab use cases (F-23–F-25): restoring a workspace's tabs and drafts, opening and saving
 * requests, and keeping drafts in step with their saved requests. Drafts auto-save to IndexedDB;
 * an explicit save writes the draft to its collection.
 */
export function createRequestService({
  draftRepository,
  requestStore,
  tabsStore,
  collectionStore,
  tabsService,
  collectionService,
  onSaveFailed,
}: RequestServiceDependencies) {
  const persistence = createDraftPersistence({
    repository: draftRepository,
    store: requestStore,
    ...(onSaveFailed ? { onSaveFailed } : {}),
  });
  /** Tabs being saved: their item changes come from this tab and must not be followed. */
  const savingTabIds = new Set<TabId>();

  const findTab = (tabId: TabId) => tabsStore.getState().tabs.find((tab) => tab.id === tabId);
  const findDraft = (tabId: TabId): RequestDraft | undefined =>
    requestStore.getState().drafts[tabId];
  const savedRequestOfTab = (tabId: TabId): RequestItem | undefined => {
    const tab = findTab(tabId);
    return tab ? savedRequestOf(tab, collectionStore.getState().items) : undefined;
  };

  /** Opens a tab with a draft of a saved request. */
  const openSaved = (saved: RequestItem, workspaceId: WorkspaceId): TabId => {
    const tab = createEditorTab({ workspaceId, entityId: saved.id });
    requestStore.getState().upsertDraft(
      draftFromSaved(
        {
          tabId: tab.id,
          workspaceId,
          baseUpdatedAt: null,
          name: saved.name,
          request: saved.request,
        },
        saved,
      ),
    );
    tabsStore.getState().openTab(tab);
    return tab.id;
  };

  /** Drops the drafts of closed tabs. */
  const followClosedTabs = () =>
    tabsStore.subscribe((state, previous) => {
      const isSameSession =
        state.status === "ready" &&
        previous.status === "ready" &&
        state.workspaceId === previous.workspaceId;
      if (!isSameSession || state.tabs === previous.tabs) return;
      const openIds = new Set(state.tabs.map((tab) => tab.id));
      const closedIds = previous.tabs.map((tab) => tab.id).filter((tabId) => !openIds.has(tabId));
      if (closedIds.length > 0) requestStore.getState().removeDrafts(closedIds);
    });

  /**
   * Keeps drafts in step with saved requests that change elsewhere: a clean draft follows the new
   * version, an edited one keeps its changes (and shows the conflict), and a deleted request
   * leaves its tab as a new, unsaved request.
   */
  const followSavedRequests = () =>
    collectionStore.subscribe((state, previous) => {
      const isSameSession =
        state.status === "ready" &&
        previous.status === "ready" &&
        state.workspaceId === previous.workspaceId;
      if (!isSameSession || state.items === previous.items) return;

      for (const tab of tabsStore.getState().tabs) {
        if (tab.kind !== "request" || savingTabIds.has(tab.id)) continue;
        const before = savedRequestOf(tab, previous.items);
        const after = savedRequestOf(tab, state.items);
        const draft = findDraft(tab.id);
        if (before === after || !draft) continue;
        if (!after) {
          tabsStore.getState().setTabEntity(tab.id, null);
          requestStore.getState().upsertDraft({ ...draft, baseUpdatedAt: null });
        } else if (
          !before ||
          matchesSavedRequest(draft, before) ||
          matchesSavedRequest(draft, after)
        ) {
          requestStore.getState().upsertDraft(draftFromSaved(draft, after));
        }
      }
    });

  /** Points a draft at the version just saved, keeping edits made while the save ran. */
  const markSaved = (tabId: TabId, saved: RequestItem, savedName: string) => {
    const current = findDraft(tabId);
    if (!current) return;
    const name = current.name === savedName ? saved.name : current.name;
    requestStore.getState().upsertDraft({ ...current, name, baseUpdatedAt: saved.updatedAt });
  };

  return {
    /** Starts auto-save and following changes; returns a function that stops both. */
    start: (): (() => void) => {
      const stops = [persistence.start(), followClosedTabs(), followSavedRequests()];
      return () => {
        for (const stop of stops) stop();
      };
    },

    /** Writes pending tab and draft changes now (before the page is hidden or a reload). */
    flush: async (): Promise<void> => {
      await Promise.all([persistence.flush(), tabsService.flush()]);
    },

    /** Restores a workspace's tabs and drafts, checked against its saved requests. */
    openWorkspace: async (workspaceId: WorkspaceId): Outcome<null> => {
      await Promise.all([persistence.flush(), tabsService.flush()]);
      tabsStore.getState().startLoading(workspaceId);
      requestStore.getState().startLoading(workspaceId);
      try {
        const [loaded, layout, drafts] = await Promise.all([
          collectionService.loadCollections(workspaceId),
          tabsService.readLayout(workspaceId),
          draftRepository.findBy("workspaceId", workspaceId),
        ]);
        if (tabsStore.getState().workspaceId !== workspaceId) return ok(null);
        if (!loaded.ok) return err("storage");

        const session = restoreSession({
          layout: layout ?? { tabs: [], activeTabId: null, recentlyClosed: [] },
          drafts,
          items: collectionStore.getState().items,
        });
        requestStore.getState().setDrafts(workspaceId, session.drafts);
        tabsStore.getState().setLoaded(session);
        await draftRepository.bulkPut(session.changedDrafts);
        await draftRepository.bulkDelete(session.orphanedDraftIds);
        return ok(null);
      } catch {
        return err("storage");
      }
    },

    /** Opens a tab with a new, empty request. Returns `null` while no workspace is loaded. */
    newRequest: (name: string): TabId | null => {
      const { workspaceId, status } = tabsStore.getState();
      if (workspaceId === null || status !== "ready") return null;
      const tab = createEditorTab({ workspaceId });
      requestStore.getState().upsertDraft({
        tabId: tab.id,
        workspaceId,
        baseUpdatedAt: null,
        name,
        request: createHttpRequestDefinition(),
      });
      tabsStore.getState().openTab(tab);
      return tab.id;
    },

    /** Shows a saved request: activates the tab that has it open, or opens a new one. */
    openRequest: (itemId: CollectionItemId): Result<TabId, RequestBuilderError> => {
      const { workspaceId, tabs } = tabsStore.getState();
      const saved = asRequestItem(collectionStore.getState().items[itemId]);
      if (workspaceId === null || !saved) return err("not_found");
      const open = tabs.find((tab) => tab.kind === "request" && tab.entityId === itemId);
      if (open) {
        tabsStore.getState().activateTab(open.id);
        return ok(open.id);
      }
      return ok(openSaved(saved, workspaceId));
    },

    /** Reopens the most recently closed tab whose request still exists. */
    reopenClosedTab: (): TabId | null => {
      const { workspaceId } = tabsStore.getState();
      if (workspaceId === null) return null;
      for (
        let closed = tabsStore.getState().takeRecentlyClosed();
        closed;
        closed = tabsStore.getState().takeRecentlyClosed()
      ) {
        const saved = savedRequestOf(closed, collectionStore.getState().items);
        if (!saved) continue;
        const open = tabsStore.getState().tabs.find((tab) => tab.entityId === saved.id);
        if (open) {
          tabsStore.getState().activateTab(open.id);
          return open.id;
        }
        return openSaved(saved, workspaceId);
      }
      return null;
    },

    /** Whether a tab has never been saved, so saving it first needs a location. */
    needsLocation: (tabId: TabId): boolean => findTab(tabId)?.entityId === null,

    /**
     * Saves a tab's draft to its request (`Mod+S`). A request never saved needs a location
     * first: the result is `needs_location`, and the caller asks for one and uses `saveAs`.
     */
    save: async (tabId: TabId): Outcome<RequestItem> => {
      const tab = findTab(tabId);
      const draft = findDraft(tabId);
      if (!tab || !draft) return err("not_found");
      if (tab.entityId === null) return err("needs_location");
      savingTabIds.add(tabId);
      try {
        const result = await collectionService.saveRequest(asId<"CollectionItemId">(tab.entityId), {
          name: draft.name,
          request: draft.request,
        });
        if (!result.ok) return err(fromCollectionError(result.error));
        const saved = asRequestItem(result.value);
        if (!saved) return err("not_found");
        markSaved(tabId, saved, draft.name);
        return ok(saved);
      } finally {
        savingTabIds.delete(tabId);
      }
    },

    /** Saves a tab's draft as a new request at a location, under a name. */
    saveAs: async (
      tabId: TabId,
      { name, location }: { name: string; location: SaveLocation },
    ): Outcome<RequestItem> => {
      const draft = findDraft(tabId);
      if (!findTab(tabId) || !draft) return err("not_found");
      let target: { collectionId: CollectionId; parentId: CollectionItemId | null };
      if ("newCollectionName" in location) {
        const created = await collectionService.createCollection(location.newCollectionName);
        if (!created.ok) return err(fromCollectionError(created.error));
        target = { collectionId: created.value.id, parentId: null };
      } else {
        target = location;
      }

      savingTabIds.add(tabId);
      try {
        const created = await collectionService.createItem({
          type: "request",
          ...target,
          name,
          request: draft.request,
        });
        if (!created.ok) return err(fromCollectionError(created.error));
        const saved = asRequestItem(created.value);
        if (!saved) return err("not_found");
        tabsStore.getState().setTabEntity(tabId, saved.id);
        const current = findDraft(tabId);
        if (current)
          requestStore
            .getState()
            .upsertDraft({ ...current, name: saved.name, baseUpdatedAt: saved.updatedAt });
        return ok(saved);
      } finally {
        savingTabIds.delete(tabId);
      }
    },

    /** Renames a tab's draft; the name is saved with the request. */
    renameDraft: (tabId: TabId, name: string): Result<null, RequestBuilderError> => {
      const draft = findDraft(tabId);
      if (!draft) return err("not_found");
      const parsed = nameSchema.safeParse(name);
      if (!parsed.success) return err("invalid_name");
      requestStore.getState().upsertDraft({ ...draft, name: parsed.data });
      return ok(null);
    },

    /** Replaces a tab's draft with its saved request, dropping the draft's changes. */
    reloadSaved: (tabId: TabId): void => {
      const draft = findDraft(tabId);
      const saved = savedRequestOfTab(tabId);
      if (draft && saved) requestStore.getState().upsertDraft(draftFromSaved(draft, saved));
    },

    /** Keeps a draft's changes over a version saved elsewhere; the next save overwrites it. */
    keepChanges: (tabId: TabId): void => {
      const draft = findDraft(tabId);
      const saved = savedRequestOfTab(tabId);
      if (draft && saved)
        requestStore.getState().upsertDraft({ ...draft, baseUpdatedAt: saved.updatedAt });
    },

    /** Whether closing a tab would lose changes. */
    isDirty: (tabId: TabId): boolean => {
      const draft = findDraft(tabId);
      return draft ? isDraftDirty(draft, savedRequestOfTab(tabId)) : false;
    },
  };
}
