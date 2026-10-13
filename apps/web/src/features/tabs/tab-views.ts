import type { ComponentType } from "react";

import { createRegistry, type EditorTab, type TabKind } from "@api-studio/core";

/** Props every tab view component receives. */
export type TabViewProps = { tab: EditorTab };

/**
 * What a kind of tab contributes (extensibility.md#registries): its label in the strip, its
 * editor, and whether it has unsaved changes. The strip and editor area never switch over tab
 * kinds; the request builder registers `request`, and environment and collection tabs follow.
 */
export type TabView = {
  readonly id: TabKind;
  /** The tab's title (with its icon or badge) inside the strip; the strip adds close and pin. */
  Label: ComponentType<TabViewProps>;
  /** The tab's content in the editor area. */
  Editor: ComponentType<TabViewProps>;
  /** Plain-text title for menus, tooltips and announcements. */
  getTitle: (tab: EditorTab) => string;
  /** Whether closing the tab would lose changes, read when the user asks to close it. */
  isDirty: (tab: EditorTab) => boolean;
};

/** The tab views of the app; registered once at startup by the features that own each kind. */
export const tabViews = createRegistry<TabView>("Tab views");
