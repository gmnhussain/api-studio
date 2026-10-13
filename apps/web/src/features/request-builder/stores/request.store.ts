import { create } from "zustand";

import type { HttpRequestDefinition, RequestDraft, TabId, WorkspaceId } from "@api-studio/core";

import type { RequestSection } from "../request-builder.constants";

/** Where restoring the open workspace's drafts stands. */
export type RequestLoadStatus = "idle" | "loading" | "ready";

export type RequestState = {
  /** The workspace whose drafts are loaded. */
  workspaceId: WorkspaceId | null;
  status: RequestLoadStatus;
  /** Drafts by the tab that edits them. */
  drafts: Readonly<Record<TabId, RequestDraft>>;
  /** The editor section each tab shows; tabs without an entry show the default section. */
  sections: Readonly<Record<TabId, RequestSection>>;
};

export type RequestActions = {
  /** Drops every draft while another workspace's drafts load. */
  startLoading: (workspaceId: WorkspaceId) => void;
  /** Replaces every draft with a workspace's restored drafts. */
  setDrafts: (workspaceId: WorkspaceId, drafts: readonly RequestDraft[]) => void;
  /** Adds a draft or replaces the one of the same tab. */
  upsertDraft: (draft: RequestDraft) => void;
  /** Applies an edit to a draft's request; edits of unknown tabs are ignored. */
  editRequest: (
    tabId: TabId,
    edit: (request: HttpRequestDefinition) => HttpRequestDefinition,
  ) => void;
  removeDrafts: (tabIds: readonly TabId[]) => void;
  setSection: (tabId: TabId, section: RequestSection) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialRequestState(): RequestState {
  return { workspaceId: null, status: "idle", drafts: {}, sections: {} };
}

function without<Value>(
  record: Readonly<Record<TabId, Value>>,
  tabIds: readonly TabId[],
): Record<TabId, Value> {
  const excluded = new Set<string>(tabIds);
  return Object.fromEntries(Object.entries(record).filter(([tabId]) => !excluded.has(tabId)));
}

/**
 * The drafts of the open tabs (glossary: Draft). Edits change only the store; the request
 * service writes them to IndexedDB shortly after they stop (F-25). A draft's dirty state is
 * derived by comparing it with its saved request, never stored.
 */
export const useRequestStore = create<RequestState & RequestActions>()((set) => ({
  ...getInitialRequestState(),
  startLoading: (workspaceId) => {
    set({ ...getInitialRequestState(), workspaceId, status: "loading" });
  },
  setDrafts: (workspaceId, drafts) => {
    set({
      workspaceId,
      status: "ready",
      drafts: Object.fromEntries(drafts.map((draft) => [draft.tabId, draft])),
      sections: {},
    });
  },
  upsertDraft: (draft) => {
    set((state) => ({ drafts: { ...state.drafts, [draft.tabId]: draft } }));
  },
  editRequest: (tabId, edit) => {
    set((state) => {
      const draft = state.drafts[tabId];
      if (!draft) return state;
      return { drafts: { ...state.drafts, [tabId]: { ...draft, request: edit(draft.request) } } };
    });
  },
  removeDrafts: (tabIds) => {
    set((state) => ({
      drafts: without(state.drafts, tabIds),
      sections: without(state.sections, tabIds),
    }));
  },
  setSection: (tabId, section) => {
    set((state) => ({ sections: { ...state.sections, [tabId]: section } }));
  },
}));
