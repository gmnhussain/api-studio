"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pin, X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { EditorTab as EditorTabRecord } from "@api-studio/core";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

import type { TabView } from "../tab-views";

/** Mouse button that closes a tab, as browsers do (the middle button). */
const MIDDLE_BUTTON = 1;

/** The actions of a tab's context menu (layout-and-interaction.md#context-menus). */
export type EditorTabActions = {
  activate: () => void;
  close: () => void;
  togglePin: () => void;
  closeOthers: () => void;
  closeToTheRight: () => void;
  closeSaved: () => void;
  closeAll: () => void;
};

/** Props for {@link EditorTab}. */
export type EditorTabProps = {
  tab: EditorTabRecord;
  view: TabView | undefined;
  isActive: boolean;
  actions: EditorTabActions;
};

/**
 * One tab in the strip (F-23): its label, a close button, middle-click to close, a context menu
 * and drag to reorder. The label names the tab for assistive technology, unsaved state included. The tab is a button; keyboard users reorder with `Mod+Shift+←/→` and
 * close with `Alt+W` or the context menu (`Shift+F10`), so the close button stays out of the
 * tab order.
 */
export function EditorTab({ tab, view, isActive, actions }: EditorTabProps) {
  const t = useTranslations("tabs");
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: tab.id,
  });
  const title = view?.getTitle(tab) ?? "";
  const TabLabel = view?.Label;

  return (
    <li
      ref={setNodeRef}
      // dnd-kit positions the dragged tab with a transform it computes while dragging.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-active={isActive || undefined}
      data-pinned={tab.isPinned || undefined}
      data-dragging={isDragging || undefined}
      className={cn(
        "group relative flex h-9 shrink-0 items-center border-r bg-surface text-sm text-muted-foreground transition-colors data-dragging:z-10 data-dragging:shadow-popover data-active:bg-background data-active:text-foreground",
        tab.isPinned ? "w-auto" : "max-w-56 min-w-28",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-primary opacity-0 group-data-active:opacity-100"
      />
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <button
              type="button"
              data-slot="editor-tab"
              aria-current={isActive ? "true" : undefined}
              onClick={actions.activate}
              onAuxClick={(event) => {
                if (event.button === MIDDLE_BUTTON) {
                  event.preventDefault();
                  actions.close();
                }
              }}
              className="flex h-full min-w-0 flex-1 items-center gap-1.5 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              {...listeners}
            />
          }
        >
          {tab.isPinned ? <Pin aria-hidden className="size-3 shrink-0" /> : null}
          {TabLabel ? <TabLabel tab={tab} /> : null}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={actions.togglePin}>
            {tab.isPinned ? t("menu.unpin") : t("menu.pin")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={actions.close}>{t("menu.close")}</ContextMenuItem>
          <ContextMenuItem onClick={actions.closeOthers}>{t("menu.closeOthers")}</ContextMenuItem>
          <ContextMenuItem onClick={actions.closeToTheRight}>
            {t("menu.closeToTheRight")}
          </ContextMenuItem>
          <ContextMenuItem onClick={actions.closeSaved}>{t("menu.closeSaved")}</ContextMenuItem>
          <ContextMenuItem onClick={actions.closeAll}>{t("menu.closeAll")}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {tab.isPinned ? null : (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("close", { title })}
          onClick={actions.close}
          className="mr-1.5 flex size-5 shrink-0 items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 group-data-active:opacity-100 hover:bg-surface-hover"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </li>
  );
}
