"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { toast } from "sonner";

import { formatJsonPath } from "@api-studio/core";

import { ShortcutHint } from "@/components/common/shortcut-hint";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { KEYMAP } from "@/config/keymap";
import { useIsApplePlatform } from "@/hooks/use-is-apple-platform";
import { copyToClipboard } from "@/lib/clipboard";
import { matchesKeyBinding, parseKeyBinding } from "@/lib/keyboard/key-binding";

import { JsonTreeRow } from "./json-tree-row";
import { useJsonTree, type JsonTreeRow as JsonTreeRowModel } from "../../hooks/use-json-tree";
import type { JsonDocument } from "../../lib/json-document";
import { BodyNotice } from "../body-notice";

/** Row height at regular density (`h-6`); rows are measured, so compact density still fits. */
const ESTIMATED_ROW_HEIGHT_PIXELS = 24;

/** Rows rendered beyond each edge of the viewport, so fast scrolling shows no gaps. */
const OVERSCAN_ROWS = 20;

const COPY_VALUE_BINDING = parseKeyBinding(KEYMAP.copyTreeValue);

/** Props for {@link JsonTree}. */
export type JsonTreeProps = { document: JsonDocument };

/**
 * A virtualized JSON tree (F-13) with the WAI-ARIA tree keyboard model: arrows move and
 * expand, Home / End jump, Enter toggles, `Mod+C` copies the value. The context menu copies
 * the value or its JSONPath. Only the rows in view are in the DOM, so a document of any size
 * scrolls smoothly.
 */
export function JsonTree({ document }: JsonTreeProps) {
  const t = useTranslations("responseViewer.tree");
  const baseId = useId();
  const isApplePlatform = useIsApplePlatform();
  const tree = useJsonTree(document);
  const { rows } = tree;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const foundIndex = rows.findIndex((row) => row.id === activeId);
  const activeIndex = foundIndex === -1 ? 0 : foundIndex;
  const activeRow = rows[activeIndex];

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual's API cannot be memoized; the compiler leaves this component as written, which the rows below do not depend on.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT_PIXELS,
    overscan: OVERSCAN_ROWS,
  });

  const domIdOf = (index: number) => `${baseId}-row-${String(index)}`;

  const moveTo = (index: number) => {
    const target = Math.min(Math.max(index, 0), rows.length - 1);
    const row = rows[target];
    if (!row) return;
    setActiveId(row.id);
    virtualizer.scrollToIndex(target);
  };

  const copy = async (what: "value" | "path", row: JsonTreeRowModel | undefined) => {
    if (row?.entry.type !== "value") return;
    const text =
      what === "path" ? formatJsonPath(row.entry.path) : await document.copyValue(row.entry.path);
    if (await copyToClipboard(text)) {
      toast.success(what === "path" ? t("copiedPath") : t("copiedValue"));
    } else {
      toast.error(t("copyFailed"));
    }
  };

  /** The row a pointer event happened on, found from its `data-index`. */
  const rowAt = (event: MouseEvent): JsonTreeRowModel | undefined => {
    if (!(event.target instanceof Element)) return undefined;
    const index = event.target.closest<HTMLElement>("[role='treeitem']")?.dataset.index;
    return index === undefined ? undefined : rows[Number(index)];
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!activeRow) return;
    switch (event.key) {
      case "ArrowDown":
        moveTo(activeIndex + 1);
        break;
      case "ArrowUp":
        moveTo(activeIndex - 1);
        break;
      case "Home":
        moveTo(0);
        break;
      case "End":
        moveTo(rows.length - 1);
        break;
      case "ArrowRight":
        if (!activeRow.isExpanded) tree.expand(activeRow);
        else if (rows[activeIndex + 1]?.parentId === activeRow.id) moveTo(activeIndex + 1);
        break;
      case "ArrowLeft": {
        if (activeRow.isExpanded) {
          tree.collapse(activeRow);
          break;
        }
        // A closed row moves to its parent; a closed top-level row stays.
        const parentIndex = rows.findIndex((row) => row.id === activeRow.parentId);
        if (parentIndex !== -1) moveTo(parentIndex);
        break;
      }
      case "Enter":
      case " ":
        tree.toggle(activeRow);
        break;
      default:
        // Copy the value unless text is selected, which the browser copies as usual.
        if (
          !matchesKeyBinding(event, COPY_VALUE_BINDING, isApplePlatform) ||
          window.getSelection()?.isCollapsed === false
        ) {
          return;
        }
        void copy("value", activeRow);
    }
    event.preventDefault();
  };

  if (tree.isLoading) return <BodyNotice isStatus>{t("parsing")}</BodyNotice>;
  if (rows.length === 0) return <BodyNotice>{t("empty")}</BodyNotice>;

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={scrollRef}
            role="tree"
            tabIndex={0}
            aria-label={t("label")}
            aria-activedescendant={activeRow ? domIdOf(activeIndex) : undefined}
            onKeyDown={handleKeyDown}
            onClick={(event) => {
              const row = rowAt(event);
              if (!row) return;
              setActiveId(row.id);
              tree.toggle(row);
            }}
            onContextMenu={(event) => {
              const row = rowAt(event);
              if (row) setActiveId(row.id);
            }}
            className="relative h-full overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          />
        }
      >
        {/* The full height of the list, so the scrollbar matches the whole tree. */}
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (!row) return null;
            return (
              <JsonTreeRow
                key={row.id}
                row={row}
                index={item.index}
                domId={domIdOf(item.index)}
                isActive={item.index === activeIndex}
                offset={item.start}
                measureRef={virtualizer.measureElement}
              />
            );
          })}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          disabled={activeRow?.entry.type !== "value"}
          onClick={() => void copy("value", activeRow)}
        >
          {t("copyValue")}
          <ShortcutHint binding={KEYMAP.copyTreeValue} className="ml-auto" />
        </ContextMenuItem>
        <ContextMenuItem
          disabled={activeRow?.entry.type !== "value"}
          onClick={() => void copy("path", activeRow)}
        >
          {t("copyPath")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
