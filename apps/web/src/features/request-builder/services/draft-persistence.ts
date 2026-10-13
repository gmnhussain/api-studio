import type { TabId } from "@api-studio/core";

import { createDebouncedTask } from "@/lib/services/debounced-task";
import type { ObservableStore } from "@/lib/services/observable-store";

import type { DraftRepository } from "../repositories/draft.repository";
import { DRAFT_SAVE_DELAY_MILLISECONDS } from "../request-builder.constants";
import type { RequestState } from "../stores/request.store";

/** Writes edited drafts to IndexedDB and removes closed ones (F-25). */
export type DraftPersistence = {
  /** Follows the request store until the returned function is called. */
  start: () => () => void;
  /** Writes pending changes now. */
  flush: () => Promise<void>;
};

/**
 * Auto-save for drafts: every changed or removed draft is noted, and the notes are written in one
 * go once edits stop. Only changes inside one loaded workspace count; loading a workspace
 * replaces drafts without them being written or deleted.
 */
export function createDraftPersistence({
  repository,
  store,
  onSaveFailed,
}: {
  repository: DraftRepository;
  store: ObservableStore<RequestState>;
  onSaveFailed?: () => void;
}): DraftPersistence {
  const changed = new Set<TabId>();
  const removed = new Set<TabId>();

  const write = async () => {
    const { drafts } = store.getState();
    const toPut = [...changed].flatMap((tabId) => drafts[tabId] ?? []);
    const toDelete = [...removed];
    changed.clear();
    removed.clear();
    if (toPut.length > 0) await repository.bulkPut(toPut);
    if (toDelete.length > 0) await repository.bulkDelete(toDelete);
  };
  const task = createDebouncedTask(write, DRAFT_SAVE_DELAY_MILLISECONDS, onSaveFailed);

  return {
    start: () => {
      const unsubscribe = store.subscribe((state, previous) => {
        const isSameSession =
          state.status === "ready" &&
          previous.status === "ready" &&
          state.workspaceId === previous.workspaceId;
        if (!isSameSession || state.drafts === previous.drafts) return;

        for (const draft of Object.values(state.drafts)) {
          if (previous.drafts[draft.tabId] !== draft) {
            changed.add(draft.tabId);
            removed.delete(draft.tabId);
          }
        }
        for (const draft of Object.values(previous.drafts)) {
          if (!(draft.tabId in state.drafts)) {
            removed.add(draft.tabId);
            changed.delete(draft.tabId);
          }
        }
        task.schedule();
      });
      return () => {
        unsubscribe();
        task.cancel();
      };
    },
    flush: () => task.flush(),
  };
}
