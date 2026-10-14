"use client";

import { useState, type ReactNode } from "react";

import type { TabId } from "@api-studio/core";

import { CloseTabsDialog } from "../components/close-tabs-dialog";
import { isTabDirty } from "../lib/is-tab-dirty";
import { useTabsStore } from "../stores/tabs.store";
import { tabViews } from "../tab-views";

/** Closing tabs with a confirmation when any of them has unsaved changes. */
export type CloseTabs = {
  /** Closes tabs at once, or after confirmation if any would lose changes. */
  requestClose: (tabIds: readonly TabId[]) => void;
  /** The confirmation dialog while one is open; render it once. */
  dialog: ReactNode;
};

/** Closing tabs (F-23): clean tabs close at once; dirty ones ask first. */
export function useCloseTabs(): CloseTabs {
  const [pending, setPending] = useState<readonly TabId[] | null>(null);
  const closeTabs = useTabsStore((state) => state.closeTabs);

  const requestClose = (tabIds: readonly TabId[]) => {
    const tabs = useTabsStore.getState().tabs.filter((tab) => tabIds.includes(tab.id));
    if (tabs.length === 0) return;
    if (tabs.some(isTabDirty)) setPending(tabIds);
    else closeTabs(tabIds);
  };

  let dialog: ReactNode = null;
  if (pending) {
    const dirty = useTabsStore
      .getState()
      .tabs.filter((tab) => pending.includes(tab.id) && isTabDirty(tab));
    const [first] = dirty;
    dialog = (
      <CloseTabsDialog
        dirtyCount={dirty.length}
        title={first ? (tabViews.get(first.kind)?.getTitle(first) ?? "") : ""}
        onConfirm={() => {
          closeTabs(pending);
          setPending(null);
        }}
        onCancel={() => {
          setPending(null);
        }}
      />
    );
  }

  return { requestClose, dialog };
}
