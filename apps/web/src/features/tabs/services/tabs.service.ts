import {
  currentTimestamp,
  type IsoDateTime,
  type TabLayout,
  type WorkspaceId,
} from "@api-studio/core";

import { createDebouncedTask } from "@/lib/services/debounced-task";
import type { ObservableStore } from "@/lib/services/observable-store";

import type { TabLayoutRepository } from "../repositories/tab-layout.repository";
import type { TabsActions, TabsState } from "../stores/tabs.store";
import { TAB_LAYOUT_SAVE_DELAY_MILLISECONDS } from "../tabs.constants";

/** Everything the service needs, injected so tests can use a real database and a fresh store. */
export type TabsServiceDependencies = {
  repository: TabLayoutRepository;
  store: ObservableStore<TabsState & TabsActions>;
  /** Called when saving the layout fails; the tabs stay open and the next change retries. */
  onSaveFailed?: () => void;
  now?: () => IsoDateTime;
};

export type TabsService = ReturnType<typeof createTabsService>;

/**
 * Restores and saves the open tabs of a workspace (F-24). Changes are written shortly after they
 * stop, so dragging a tab across the strip is one write; `flush` writes at once when the page is
 * hidden.
 */
export function createTabsService({
  repository,
  store,
  onSaveFailed,
  now = currentTimestamp,
}: TabsServiceDependencies) {
  const save = async () => {
    const { workspaceId, status, tabs, activeTabId, recentlyClosed } = store.getState();
    if (workspaceId === null || status !== "ready") return;
    await repository.put({ workspaceId, tabs, activeTabId, recentlyClosed, updatedAt: now() });
  };
  const task = createDebouncedTask(save, TAB_LAYOUT_SAVE_DELAY_MILLISECONDS, onSaveFailed);

  return {
    /** The saved layout of a workspace, or `undefined` when it has none (or it was invalid). */
    readLayout: (workspaceId: WorkspaceId): Promise<TabLayout | undefined> =>
      repository.get(workspaceId),

    /**
     * Saves the layout whenever tabs change, until the returned function is called. Call `flush`
     * before loading another workspace: a change still waiting then would be dropped.
     */
    saveChanges: (): (() => void) => {
      const unsubscribe = store.subscribe((state, previous) => {
        if (state.workspaceId !== previous.workspaceId) {
          task.cancel();
          return;
        }
        if (
          state.tabs !== previous.tabs ||
          state.activeTabId !== previous.activeTabId ||
          state.recentlyClosed !== previous.recentlyClosed
        ) {
          task.schedule();
        }
      });
      return () => {
        unsubscribe();
        task.cancel();
      };
    },

    /** Writes a pending change now. */
    flush: (): Promise<void> => task.flush(),
  };
}
