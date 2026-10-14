"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { GO_TO_TAB_BINDINGS, KEYMAP } from "@/config/keymap";
import { useHotkeys, type HotkeyEntry } from "@/hooks/use-hotkeys";

import { useCloseTabs } from "../hooks/use-close-tabs";
import { useTabsStore } from "../stores/tabs.store";
import { tabViews } from "../tab-views";
import { EditorTabs } from "./editor-tabs";

/** Props for {@link EditorArea}. */
export type EditorAreaProps = {
  onNewTab: () => void;
  onReopenClosedTab: () => void;
  /** Shown while no tab is open. */
  emptyState: ReactNode;
  /** Shown while the tabs are being restored. */
  loadingState: ReactNode;
};

/**
 * The centre of the studio: the tab strip and the active tab's editor, contributed by its tab
 * view (F-23). Owns the tab shortcuts (layout-and-interaction.md#keyboard-shortcuts) and
 * announces keyboard moves, since a moved tab gives no other feedback to a screen reader.
 */
export function EditorArea({
  onNewTab,
  onReopenClosedTab,
  emptyState,
  loadingState,
}: EditorAreaProps) {
  const t = useTranslations("tabs");
  const status = useTabsStore((state) => state.status);
  const activeTab = useTabsStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId));
  const { requestClose, dialog } = useCloseTabs();
  const [announcement, setAnnouncement] = useState("");

  const moveActive = (offset: number) => {
    const { tabs, activeTabId, moveTab } = useTabsStore.getState();
    const index = tabs.findIndex((tab) => tab.id === activeTabId);
    const tab = tabs[index];
    if (!tab) return;
    moveTab(tab.id, index + offset);
    const moved = useTabsStore.getState().tabs;
    setAnnouncement(
      t("announcements.moved", {
        title: tabViews.get(tab.kind)?.getTitle(tab) ?? "",
        position: moved.findIndex((candidate) => candidate.id === tab.id) + 1,
        total: moved.length,
      }),
    );
  };

  const hotkeys: HotkeyEntry[] = [
    { binding: KEYMAP.newRequestTab, onPress: onNewTab },
    { binding: KEYMAP.reopenClosedTab, onPress: onReopenClosedTab },
    {
      binding: KEYMAP.closeTab,
      onPress: () => {
        const { activeTabId } = useTabsStore.getState();
        if (activeTabId !== null) requestClose([activeTabId]);
      },
    },
    {
      binding: KEYMAP.nextTab,
      onPress: () => {
        useTabsStore.getState().activateRelativeTab(1);
      },
    },
    {
      binding: KEYMAP.previousTab,
      onPress: () => {
        useTabsStore.getState().activateRelativeTab(-1);
      },
    },
    {
      binding: KEYMAP.moveTabLeft,
      onPress: () => {
        moveActive(-1);
      },
    },
    {
      binding: KEYMAP.moveTabRight,
      onPress: () => {
        moveActive(1);
      },
    },
    ...GO_TO_TAB_BINDINGS.map((binding, index) => ({
      binding,
      onPress: () => {
        useTabsStore.getState().activateTabAt(index);
      },
    })),
  ];
  useHotkeys(hotkeys, { enabled: status === "ready" });

  const Editor = activeTab ? tabViews.get(activeTab.kind)?.Editor : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {status === "ready" ? <EditorTabs onNewTab={onNewTab} onRequestClose={requestClose} /> : null}
      <div className="min-h-0 flex-1">
        {status !== "ready" ? (
          loadingState
        ) : activeTab && Editor ? (
          <Editor key={activeTab.id} tab={activeTab} />
        ) : (
          emptyState
        )}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {dialog}
    </div>
  );
}
