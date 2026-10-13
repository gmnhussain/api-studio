import type { Layout } from "react-resizable-panels";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { browserCookieStorage } from "@/lib/cookies/browser-cookie-storage";

import { LAYOUT_COOKIE, type PanelGroupId, type SidebarSectionId } from "../shell.constants";

/** Saved sizes per panel group; a group without an entry uses its panels' default sizes. */
export type PanelLayouts = Partial<Record<PanelGroupId, Layout>>;

export type UiState = {
  sidebarSection: SidebarSectionId;
  layouts: PanelLayouts;
};

export type UiActions = {
  setSidebarSection: (section: SidebarSectionId) => void;
  setLayout: (groupId: PanelGroupId, layout: Layout) => void;
};

export type UiStore = ReturnType<typeof createUiStore>;

/** Version of the persisted UI state; bump it with a migration when the shape changes. */
const UI_STATE_VERSION = 1;

/**
 * Creates the UI store (ADR-0011). The workspace route reads the layout cookie on the server and
 * passes it in as `initialState`, so the first render already has the saved layout; the store
 * therefore never rehydrates and only writes the cookie when something changes.
 */
export function createUiStore(initialState: UiState) {
  return createStore<UiState & UiActions>()(
    persist(
      (set) => ({
        ...initialState,
        setSidebarSection: (sidebarSection) => {
          set({ sidebarSection });
        },
        setLayout: (groupId, layout) => {
          set((state) => ({ layouts: { ...state.layouts, [groupId]: layout } }));
        },
      }),
      {
        name: LAYOUT_COOKIE,
        version: UI_STATE_VERSION,
        storage: createJSONStorage(() => browserCookieStorage),
        skipHydration: true,
        partialize: (state): UiState => ({
          sidebarSection: state.sidebarSection,
          layouts: state.layouts,
        }),
      },
    ),
  );
}

/**
 * Tells whether a collapsible panel is collapsed in a saved layout. Collapsible panels collapse
 * to size 0; a group with no saved layout shows its defaults, which are all expanded.
 */
export function isPanelCollapsed(
  layouts: PanelLayouts,
  groupId: PanelGroupId,
  panelId: string,
): boolean {
  return layouts[groupId]?.[panelId] === 0;
}
