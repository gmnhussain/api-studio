import { create } from "zustand";

import {
  RECENTLY_CLOSED_TABS_LIMIT,
  type EditorTab,
  type TabId,
  type TabLayout,
  type WorkspaceId,
} from "@api-studio/core";

import { moveTab, nextActiveTabId, relativeTabId, setPinned } from "./tab-order";

/**
 * Where restoring the open workspace's tabs stands. `failed` keeps the stored layout untouched:
 * nothing is saved until a restore succeeds.
 */
export type TabsLoadStatus = "idle" | "loading" | "ready" | "failed";

export type TabsState = {
  /** The workspace whose tabs these are. */
  workspaceId: WorkspaceId | null;
  status: TabsLoadStatus;
  /** Open tabs in strip order, pinned first. */
  tabs: EditorTab[];
  activeTabId: TabId | null;
  /** Closed tabs that can be reopened, newest first. */
  recentlyClosed: EditorTab[];
};

export type TabsActions = {
  startLoading: (workspaceId: WorkspaceId) => void;
  /** Shows a restored layout; an active id that is not open falls back to the first tab. */
  setLoaded: (layout: Pick<TabLayout, "tabs" | "activeTabId" | "recentlyClosed">) => void;
  /** Marks the restore as failed, so the editor explains it and nothing overwrites saved tabs. */
  setFailed: () => void;
  /** Adds a tab at the end of the strip and activates it. */
  openTab: (tab: EditorTab) => void;
  activateTab: (tabId: TabId) => void;
  /** Activates the tab `offset` places away, wrapping around (next and previous tab). */
  activateRelativeTab: (offset: number) => void;
  /** Activates the tab at a position (go to tab 1–9); a position past the end does nothing. */
  activateTabAt: (index: number) => void;
  /**
   * Closes tabs. Closed tabs that show something saved are remembered for "reopen closed tab";
   * a closed unsaved request is gone with its draft.
   */
  closeTabs: (tabIds: readonly TabId[]) => void;
  /** Removes and returns the most recently closed tab, or `undefined` when there is none. */
  takeRecentlyClosed: () => EditorTab | undefined;
  moveTab: (tabId: TabId, toIndex: number) => void;
  setPinned: (tabId: TabId, isPinned: boolean) => void;
  /** Points a tab at what it shows: the item a new request was saved as, or `null` once deleted. */
  setTabEntity: (tabId: TabId, entityId: string | null) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialTabsState(): TabsState {
  return { workspaceId: null, status: "idle", tabs: [], activeTabId: null, recentlyClosed: [] };
}

/**
 * The open workspace's editor tabs (F-23). A module-level store: tabs are restored from
 * IndexedDB in the browser and never rendered on the server. The tabs service saves each change.
 */
export const useTabsStore = create<TabsState & TabsActions>()((set, get) => ({
  ...getInitialTabsState(),
  startLoading: (workspaceId) => {
    set({ ...getInitialTabsState(), workspaceId, status: "loading" });
  },
  setLoaded: ({ tabs, activeTabId, recentlyClosed }) => {
    const hasActive = tabs.some((tab) => tab.id === activeTabId);
    set({
      status: "ready",
      tabs: [...tabs],
      activeTabId: hasActive ? activeTabId : (tabs[0]?.id ?? null),
      recentlyClosed: [...recentlyClosed],
    });
  },
  setFailed: () => {
    set({ status: "failed" });
  },
  openTab: (tab) => {
    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }));
  },
  activateTab: (tabId) => {
    if (get().tabs.some((tab) => tab.id === tabId)) set({ activeTabId: tabId });
  },
  activateRelativeTab: (offset) => {
    set((state) => ({ activeTabId: relativeTabId(state.tabs, state.activeTabId, offset) }));
  },
  activateTabAt: (index) => {
    const tab = get().tabs[index];
    if (tab) set({ activeTabId: tab.id });
  },
  closeTabs: (tabIds) => {
    set((state) => {
      const closing = new Set(tabIds);
      const closed = state.tabs.filter((tab) => closing.has(tab.id) && tab.entityId !== null);
      return {
        tabs: state.tabs.filter((tab) => !closing.has(tab.id)),
        activeTabId: nextActiveTabId(state.tabs, state.activeTabId, closing),
        recentlyClosed: [...closed.reverse(), ...state.recentlyClosed].slice(
          0,
          RECENTLY_CLOSED_TABS_LIMIT,
        ),
      };
    });
  },
  takeRecentlyClosed: () => {
    const [latest, ...rest] = get().recentlyClosed;
    if (latest) set({ recentlyClosed: rest });
    return latest;
  },
  moveTab: (tabId, toIndex) => {
    set((state) => ({ tabs: moveTab(state.tabs, tabId, toIndex) }));
  },
  setPinned: (tabId, isPinned) => {
    set((state) => ({ tabs: setPinned(state.tabs, tabId, isPinned) }));
  },
  setTabEntity: (tabId, entityId) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, entityId } : tab)),
    }));
  },
}));
