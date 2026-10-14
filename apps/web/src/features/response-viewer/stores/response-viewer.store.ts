import { create } from "zustand";

import type { TabId } from "@api-studio/core";

/** The parts of a response, each in its own section of the response panel. */
export const RESPONSE_SECTIONS = ["body", "headers", "cookies", "timeline"] as const;

export type ResponseSection = (typeof RESPONSE_SECTIONS)[number];

/** How one tab shows its response. */
export type TabResponseView = {
  section: ResponseSection;
  /** The body view the user picked; `null` for the default of each body. */
  viewerId: string | null;
};

/** What a tab shows before the user picks anything. */
export const DEFAULT_TAB_RESPONSE_VIEW: TabResponseView = { section: "body", viewerId: null };

export type ResponseViewerState = {
  views: Readonly<Record<TabId, TabResponseView>>;
};

export type ResponseViewerActions = {
  setSection: (tabId: TabId, section: ResponseSection) => void;
  setViewer: (tabId: TabId, viewerId: string) => void;
  forgetTabs: (tabIds: readonly TabId[]) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialResponseViewerState(): ResponseViewerState {
  return { views: {} };
}

/**
 * The section and body view each tab shows, so switching tabs and sending again keep them.
 * Memory only: a reload starts from the defaults.
 */
export const useResponseViewerStore = create<ResponseViewerState & ResponseViewerActions>()(
  (set) => ({
    ...getInitialResponseViewerState(),
    setSection: (tabId, section) => {
      set((state) => ({
        views: {
          ...state.views,
          [tabId]: { ...(state.views[tabId] ?? DEFAULT_TAB_RESPONSE_VIEW), section },
        },
      }));
    },
    setViewer: (tabId, viewerId) => {
      set((state) => ({
        views: {
          ...state.views,
          [tabId]: { ...(state.views[tabId] ?? DEFAULT_TAB_RESPONSE_VIEW), viewerId },
        },
      }));
    },
    forgetTabs: (tabIds) => {
      set((state) => {
        const removed = new Set<string>(tabIds);
        if (!Object.keys(state.views).some((tabId) => removed.has(tabId))) return state;
        return {
          views: Object.fromEntries(
            Object.entries(state.views).filter(([tabId]) => !removed.has(tabId)),
          ),
        };
      });
    },
  }),
);
