"use client";

import {
  asId,
  withPathVariables,
  withQueryParameters,
  withUrl,
  type AuthConfig,
  type HttpMethod,
  type KeyValueEntry,
  type RequestBody,
  type RequestDraft,
  type RequestSettings,
  type TabId,
} from "@api-studio/core";

import { useCollectionStore } from "@/features/collections";
import { useTabsStore } from "@/features/tabs";

import { asRequestItem, hasSavedConflict, isDraftDirty } from "../lib/draft-status";
import { useRequestStore } from "../stores/request.store";

/** A tab's draft, or `undefined` while it is not loaded. */
export function useDraft(tabId: TabId): RequestDraft | undefined {
  return useRequestStore((state) => state.drafts[tabId]);
}

/** Whether a tab's draft has unsaved changes, and whether its request changed elsewhere. */
export function useDraftStatus(tabId: TabId): { isDirty: boolean; hasConflict: boolean } {
  const draft = useDraft(tabId);
  const entityId = useTabsStore(
    (state) => state.tabs.find((tab) => tab.id === tabId)?.entityId ?? null,
  );
  const saved = useCollectionStore((state) =>
    entityId === null ? undefined : asRequestItem(state.items[asId<"CollectionItemId">(entityId)]),
  );
  return {
    isDirty: draft ? isDraftDirty(draft, saved) : false,
    hasConflict: draft ? hasSavedConflict(draft, saved) : false,
  };
}

/** The edits a request editor makes to its tab's draft; each keeps URL and tables in sync. */
export type DraftEditor = {
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setQueryParameters: (entries: KeyValueEntry[]) => void;
  setPathVariables: (entries: KeyValueEntry[]) => void;
  setHeaders: (entries: KeyValueEntry[]) => void;
  setCookies: (entries: KeyValueEntry[]) => void;
  setAuth: (auth: AuthConfig) => void;
  setBody: (body: RequestBody) => void;
  setSettings: (settings: RequestSettings) => void;
};

/** Edit functions for a tab's draft. */
export function useDraftEditor(tabId: TabId): DraftEditor {
  const editRequest = useRequestStore((state) => state.editRequest);
  return {
    setMethod: (method) => {
      editRequest(tabId, (request) => ({ ...request, method }));
    },
    setUrl: (url) => {
      editRequest(tabId, (request) => withUrl(request, url));
    },
    setQueryParameters: (entries) => {
      editRequest(tabId, (request) => withQueryParameters(request, entries));
    },
    setPathVariables: (entries) => {
      editRequest(tabId, (request) => withPathVariables(request, entries));
    },
    setHeaders: (headers) => {
      editRequest(tabId, (request) => ({ ...request, headers }));
    },
    setCookies: (cookies) => {
      editRequest(tabId, (request) => ({ ...request, cookies }));
    },
    setAuth: (auth) => {
      editRequest(tabId, (request) => ({ ...request, auth }));
    },
    setBody: (body) => {
      editRequest(tabId, (request) => ({ ...request, body }));
    },
    setSettings: (settings) => {
      editRequest(tabId, (request) => ({ ...request, settings }));
    },
  };
}
