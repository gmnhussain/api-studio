"use client";

import { useState } from "react";

import type { KeyValueEntry, VariableMap } from "@api-studio/core";

import { cn } from "@/lib/utils";

import { KeyValueRow } from "./key-value-row";
import type { KeyValueTableLabels } from "./key-value-table-labels";
import type { VariableInputProps } from "../variable-input/variable-input";

/** Props for {@link KeyValueTable}. */
export type KeyValueTableProps<Entry extends KeyValueEntry> = {
  entries: readonly Entry[];
  onEntriesChange: (entries: Entry[]) => void;
  /** Creates the empty row offered at the end; it joins the table once something is typed. */
  createEntry: () => Entry;
  variables: VariableMap;
  /** Suggestions for the key column, such as common header names. */
  keySuggestions?: readonly string[];
  /** Keys come from elsewhere (path variables from the URL): no adding, removing or renaming. */
  hasFixedKeys?: boolean;
  hasDescription?: boolean;
  renderVariableDetail?: VariableInputProps["renderVariableDetail"];
  labels: KeyValueTableLabels;
  /** Names the table for assistive technology, e.g. "Query parameters". */
  "aria-label": string;
  className?: string;
};

/**
 * Editable key-value rows with an enabled flag (design-system.md#shared-composites), the base of
 * the parameter, header, cookie and form tables. A placeholder row at the end turns into a real
 * row on the first keystroke and keeps its id, so focus stays in the field being typed into.
 */
export function KeyValueTable<Entry extends KeyValueEntry>({
  entries,
  onEntriesChange,
  createEntry,
  variables,
  keySuggestions,
  hasFixedKeys = false,
  hasDescription = true,
  renderVariableDetail,
  labels,
  "aria-label": ariaLabel,
  className,
}: KeyValueTableProps<Entry>) {
  const [placeholder, setPlaceholder] = useState(createEntry);
  const rows = hasFixedKeys ? entries : [...entries, placeholder];

  const changeRow = (index: number, entry: Entry) => {
    if (index === entries.length) {
      onEntriesChange([...entries, entry]);
      setPlaceholder(createEntry());
      return;
    }
    onEntriesChange(entries.map((existing, position) => (position === index ? entry : existing)));
  };

  const removeRow = (index: number) => {
    onEntriesChange(entries.filter((_, position) => position !== index));
  };

  return (
    <table
      aria-label={ariaLabel}
      className={cn("w-full table-fixed border-separate border-spacing-0 text-sm", className)}
    >
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th scope="col" className="w-9 border-b">
            <span className="sr-only">{labels.enabled}</span>
          </th>
          <th scope="col" className="border-b px-3.5 py-1.5 font-medium">
            {labels.key}
          </th>
          <th scope="col" className="border-b px-3.5 py-1.5 font-medium">
            {labels.value}
          </th>
          {hasDescription ? (
            <th scope="col" className="border-b px-3.5 py-1.5 font-medium">
              {labels.description}
            </th>
          ) : null}
          <th scope="col" className="w-9 border-b">
            <span className="sr-only">{labels.actions}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((entry, index) => (
          <KeyValueRow
            key={entry.id}
            entry={entry}
            isPlaceholder={!hasFixedKeys && index === entries.length}
            hasFixedKeys={hasFixedKeys}
            hasDescription={hasDescription}
            onChange={(changed) => {
              changeRow(index, changed);
            }}
            onRemove={() => {
              removeRow(index);
            }}
            variables={variables}
            keySuggestions={keySuggestions}
            renderVariableDetail={renderVariableDetail}
            labels={labels}
          />
        ))}
      </tbody>
    </table>
  );
}
