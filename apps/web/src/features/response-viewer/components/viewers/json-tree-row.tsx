"use client";

import { ChevronRight, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import type { JsonValueKind } from "@api-studio/core";

import { cn } from "@/lib/utils";

import type { JsonTreeRow as JsonTreeRowModel } from "../../hooks/use-json-tree";

/** Value colours, the same the code editor uses for JSON (monaco-theme.ts). */
const VALUE_CLASSES: Readonly<Record<JsonValueKind, string>> = {
  string: "text-success",
  number: "text-warning",
  boolean: "text-info",
  null: "text-info",
  object: "text-muted-foreground",
  array: "text-muted-foreground",
};

/** Props for {@link JsonTreeRow}. */
export type JsonTreeRowProps = {
  row: JsonTreeRowModel;
  domId: string;
  isActive: boolean;
  /** Where the virtual list places the row, in pixels from the top. */
  offset: number;
  /** The virtual list's measuring ref and the index it measures the row by. */
  measureRef: (element: HTMLElement | null) => void;
  index: number;
};

/** What a row shows after its key: a primitive's value or a container's size. */
function RowValue({ row }: { row: JsonTreeRowModel }) {
  const t = useTranslations("responseViewer.tree");
  const { entry } = row;
  if (entry.type === "range") return null;
  if (entry.kind === "object" || entry.kind === "array") {
    return (
      <span className="text-muted-foreground">
        {entry.kind === "object"
          ? t("keyCount", { count: entry.childCount })
          : t("itemCount", { count: entry.childCount })}
      </span>
    );
  }
  return (
    <span className={cn("truncate", VALUE_CLASSES[entry.kind])}>
      {entry.kind === "string" ? JSON.stringify(entry.preview) : entry.preview}
    </span>
  );
}

/**
 * One row of the JSON tree (F-13): a disclosure chevron, the key or index, and the value. The
 * tree owns focus (`aria-activedescendant`) and handles clicks for every row, which it finds by
 * `data-index`, so rows are never tab stops.
 */
export function JsonTreeRow({ row, domId, isActive, offset, measureRef, index }: JsonTreeRowProps) {
  const t = useTranslations("responseViewer.tree");
  const { entry } = row;
  const key = entry.type === "range" ? null : entry.path.at(-1);
  const levelStyle = {
    "--tree-level": row.level - 1,
    transform: `translateY(${String(offset)}px)`,
  } as CSSProperties;

  return (
    <div
      ref={measureRef}
      id={domId}
      role="treeitem"
      aria-level={row.level}
      aria-setsize={row.setSize}
      aria-posinset={row.positionInSet}
      aria-expanded={row.isExpandable ? row.isExpanded : undefined}
      aria-selected={isActive}
      data-index={index}
      data-active={isActive || undefined}
      // The virtual list places each row; the level variable indents it.
      style={levelStyle}
      className="absolute inset-x-0 top-0 flex h-6 cursor-default items-center gap-1 ps-[calc(var(--tree-level)*var(--spacing)*4_+_var(--spacing)*2)] pr-3 font-mono text-xs whitespace-nowrap hover:bg-surface-hover data-active:bg-surface-selected"
    >
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        {row.isLoading ? (
          <LoaderCircle className="size-3 animate-spin text-muted-foreground motion-reduce:animate-none" />
        ) : row.isExpandable ? (
          <ChevronRight
            className={cn(
              "duration-fast size-3.5 text-muted-foreground transition-transform",
              row.isExpanded && "rotate-90",
            )}
          />
        ) : null}
      </span>
      {entry.type === "range" ? (
        <span className="text-muted-foreground">
          {t("range", { first: entry.start, last: entry.end - 1 })}
        </span>
      ) : (
        <>
          {key === undefined ? null : (
            <span className={typeof key === "number" ? "text-muted-foreground" : "text-primary"}>
              {typeof key === "number" ? String(key) : JSON.stringify(key)}
              <span className="text-muted-foreground">:</span>
            </span>
          )}
          <RowValue row={row} />
        </>
      )}
    </div>
  );
}
