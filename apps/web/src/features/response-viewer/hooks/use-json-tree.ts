"use client";

import { useEffect, useState } from "react";

import type { JsonTreeEntry } from "@api-studio/core";

import type { JsonDocument } from "../lib/json-document";

/** One visible row of the JSON tree, with what WAI-ARIA needs to describe its place. */
export type JsonTreeRow = {
  /** Stable while the document is shown: the path, plus the range for range rows. */
  id: string;
  entry: JsonTreeEntry;
  /** `aria-level`, from 1. */
  level: number;
  parentId: string | null;
  setSize: number;
  positionInSet: number;
  isExpandable: boolean;
  isExpanded: boolean;
  /** Expanded, with its children still on their way from the document. */
  isLoading: boolean;
};

type LoadedChildren = ReadonlyMap<string, readonly JsonTreeEntry[]>;

function rowIdOf(entry: JsonTreeEntry): string {
  const path = JSON.stringify(entry.path);
  return entry.type === "range" ? `${path}[${String(entry.start)}:${String(entry.end)}]` : path;
}

/** A listing fails only once its document is closed: the body changed and the tree goes too. */
function ignoreClosedDocument(): void {
  // Nothing to show: the tree that asked is unmounting.
}

function isExpandable(entry: JsonTreeEntry): boolean {
  return entry.type === "range" || entry.childCount > 0;
}

/** An object or array, even an empty one: as the root, its children are the top level. */
function isContainer(entry: JsonTreeEntry): boolean {
  return entry.type === "value" && (entry.kind === "object" || entry.kind === "array");
}

/** The rows a person sees: expanded rows are followed by their loaded children. */
function flattenRows(
  topEntries: readonly JsonTreeEntry[],
  children: LoadedChildren,
  expanded: ReadonlySet<string>,
): JsonTreeRow[] {
  const rows: JsonTreeRow[] = [];
  const visit = (entries: readonly JsonTreeEntry[], level: number, parentId: string | null) => {
    entries.forEach((entry, index) => {
      const id = rowIdOf(entry);
      const expandable = isExpandable(entry);
      const isExpanded = expandable && expanded.has(id);
      const loaded = isExpanded ? children.get(id) : undefined;
      rows.push({
        id,
        entry,
        level,
        parentId,
        setSize: entries.length,
        positionInSet: index + 1,
        isExpandable: expandable,
        isExpanded,
        isLoading: isExpanded && loaded === undefined,
      });
      if (loaded) visit(loaded, level + 1, id);
    });
  };
  visit(topEntries, 1, null);
  return rows;
}

/** The JSON tree's expansion state and visible rows. */
export type JsonTree = {
  rows: readonly JsonTreeRow[];
  /** Whether the top level is still being listed. */
  isLoading: boolean;
  expand: (row: JsonTreeRow) => void;
  collapse: (row: JsonTreeRow) => void;
  toggle: (row: JsonTreeRow) => void;
};

/**
 * Expansion state for a document's tree. The root container is always open, so its keys or
 * items are the top level (none for `{}` or `[]`); a primitive root is the only row. Children are listed from the
 * document the first time a row is expanded and kept for when it is expanded again.
 */
export function useJsonTree(document: JsonDocument): JsonTree {
  const { root } = document;
  const rootId = rowIdOf(root);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [children, setChildren] = useState<LoadedChildren>(() => new Map());

  const loadChildren = (entry: JsonTreeEntry, id: string) => {
    const listing =
      entry.type === "range"
        ? document.listChildren(entry.path, { start: entry.start, end: entry.end })
        : document.listChildren(entry.path);
    listing.then((entries) => {
      setChildren((previous) => new Map(previous).set(id, entries));
    }, ignoreClosedDocument);
  };

  useEffect(() => {
    if (!isExpandable(document.root)) return;
    const id = rowIdOf(document.root);
    document.listChildren(document.root.path).then((entries) => {
      setChildren((previous) => new Map(previous).set(id, entries));
    }, ignoreClosedDocument);
  }, [document]);

  const topEntries = isContainer(root) ? (children.get(rootId) ?? []) : [root];
  const isLoading = isExpandable(root) && !children.has(rootId);
  const rows = flattenRows(topEntries, children, expanded);

  const expand = (row: JsonTreeRow) => {
    if (!row.isExpandable || row.isExpanded) return;
    setExpanded((previous) => new Set(previous).add(row.id));
    if (!children.has(row.id)) loadChildren(row.entry, row.id);
  };

  const collapse = (row: JsonTreeRow) => {
    if (!row.isExpanded) return;
    setExpanded((previous) => {
      const next = new Set(previous);
      next.delete(row.id);
      return next;
    });
  };

  return {
    rows,
    isLoading,
    expand,
    collapse,
    toggle: (row) => {
      if (row.isExpanded) collapse(row);
      else expand(row);
    },
  };
}
