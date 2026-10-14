"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { asId, type TabId } from "@api-studio/core";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KEYMAP } from "@/config/keymap";
import { useAriaKeyShortcuts } from "@/hooks/use-aria-key-shortcuts";
import { useHorizontalOverflow } from "@/hooks/use-horizontal-overflow";
import { cn } from "@/lib/utils";

import { isTabDirty } from "../lib/is-tab-dirty";
import { otherTabIds, tabIdsToTheRight } from "../stores/tab-order";
import { useTabsStore } from "../stores/tabs.store";
import { tabViews } from "../tab-views";
import { EditorTab } from "./editor-tab";

/** Pointer travel before a press becomes a drag, so a click still activates the tab. */
const DRAG_ACTIVATION_DISTANCE_PIXELS = 4;

/** Props for {@link EditorTabs}. */
export type EditorTabsProps = {
  onNewTab: () => void;
  /** Closes tabs, confirming first when any has unsaved changes. */
  onRequestClose: (tabIds: readonly TabId[]) => void;
};

/**
 * The tab strip (layout-and-interaction.md#shell): pinned tabs first, drag to reorder, overflow
 * that scrolls with fading edges and an "all tabs" menu, and a new-request button.
 */
export function EditorTabs({ onNewTab, onRequestClose }: EditorTabsProps) {
  const t = useTranslations("tabs");
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const { activateTab, moveTab, setPinned } = useTabsStore.getState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const overflow = useHorizontalOverflow(scrollRef);
  const newTabShortcut = useAriaKeyShortcuts(KEYMAP.newRequestTab);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PIXELS },
    }),
  );

  useEffect(() => {
    // Keep the active tab visible when it changes by shortcut, menu or a new tab.
    scrollRef.current
      ?.querySelector("[data-active]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeTabId, tabs.length]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const toIndex = tabs.findIndex((tab) => tab.id === over.id);
    if (toIndex !== -1) moveTab(asId<"TabId">(String(active.id)), toIndex);
  };

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b bg-surface">
      <div
        ref={scrollRef}
        className={cn(
          "flex min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto overflow-y-hidden",
          overflow.start && overflow.end && "mask-x-from-95% mask-x-to-100%",
          overflow.start && !overflow.end && "mask-l-from-95% mask-l-to-100%",
          !overflow.start && overflow.end && "mask-r-from-95% mask-r-to-100%",
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map((tab) => tab.id)}
            strategy={horizontalListSortingStrategy}
          >
            <ul aria-label={t("stripLabel")} className="flex">
              {tabs.map((tab) => (
                <EditorTab
                  key={tab.id}
                  tab={tab}
                  view={tabViews.get(tab.kind)}
                  isActive={tab.id === activeTabId}
                  actions={{
                    activate: () => {
                      activateTab(tab.id);
                    },
                    close: () => {
                      onRequestClose([tab.id]);
                    },
                    togglePin: () => {
                      setPinned(tab.id, !tab.isPinned);
                    },
                    closeOthers: () => {
                      onRequestClose(otherTabIds(tabs, tab.id));
                    },
                    closeToTheRight: () => {
                      onRequestClose(tabIdsToTheRight(tabs, tab.id));
                    },
                    closeSaved: () => {
                      onRequestClose(
                        tabs
                          .filter((candidate) => !isTabDirty(candidate))
                          .map((candidate) => candidate.id),
                      );
                    },
                    closeAll: () => {
                      onRequestClose(tabs.map((candidate) => candidate.id));
                    },
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 border-l px-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNewTab}
          aria-label={t("newTab")}
          aria-keyshortcuts={newTabShortcut}
        >
          <Plus aria-hidden />
        </Button>
        {tabs.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label={t("allTabs")} />}
            >
              <ChevronDown aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => {
                    activateTab(tab.id);
                  }}
                  className={cn(tab.id === activeTabId && "bg-surface-selected")}
                >
                  <span className="truncate">{tabViews.get(tab.kind)?.getTitle(tab)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
