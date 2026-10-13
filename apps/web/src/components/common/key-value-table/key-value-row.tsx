"use client";

import { X } from "lucide-react";

import type { KeyValueEntry, VariableMap } from "@api-studio/core";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { KeyValueTableLabels } from "./key-value-table-labels";
import { VariableInput, type VariableInputProps } from "../variable-input/variable-input";

/** Props for {@link KeyValueRow}. */
export type KeyValueRowProps<Entry extends KeyValueEntry> = {
  entry: Entry;
  /** The empty row at the end that becomes a real row as soon as something is typed into it. */
  isPlaceholder: boolean;
  hasFixedKeys: boolean;
  hasDescription: boolean;
  onChange: (entry: Entry) => void;
  onRemove: () => void;
  variables: VariableMap;
  keySuggestions?: readonly string[];
  renderVariableDetail?: VariableInputProps["renderVariableDetail"];
  labels: KeyValueTableLabels;
};

/** One row of a {@link KeyValueTable}: enabled box, key, value, description and remove button. */
export function KeyValueRow<Entry extends KeyValueEntry>({
  entry,
  isPlaceholder,
  hasFixedKeys,
  hasDescription,
  onChange,
  onRemove,
  variables,
  keySuggestions,
  renderVariableDetail,
  labels,
}: KeyValueRowProps<Entry>) {
  const rowName = entry.key === "" ? labels.untitledRow : entry.key;
  const isMuted = !entry.enabled && !isPlaceholder;

  return (
    <tr data-placeholder={isPlaceholder || undefined} className="group border-b last:border-b-0">
      <td className="w-9 px-2.5 align-middle">
        {isPlaceholder ? null : (
          <Checkbox
            checked={entry.enabled}
            onCheckedChange={(enabled) => {
              onChange({ ...entry, enabled });
            }}
            aria-label={labels.enableRow(rowName)}
          />
        )}
      </td>
      <td className={cn("p-1", isMuted && "opacity-60")}>
        {hasFixedKeys ? (
          <span className="block truncate px-2.5 font-mono text-sm">{entry.key}</span>
        ) : (
          <VariableInput
            value={entry.key}
            onValueChange={(key) => {
              onChange({ ...entry, key });
            }}
            variables={variables}
            suggestions={keySuggestions}
            renderVariableDetail={renderVariableDetail}
            placeholder={isPlaceholder ? labels.keyPlaceholder : undefined}
            aria-label={isPlaceholder ? labels.newKey : labels.keyOf(rowName)}
            className="border-transparent hover:border-input"
          />
        )}
      </td>
      <td className={cn("p-1", isMuted && "opacity-60")}>
        <VariableInput
          value={entry.value}
          onValueChange={(value) => {
            onChange({ ...entry, value });
          }}
          variables={variables}
          renderVariableDetail={renderVariableDetail}
          placeholder={isPlaceholder ? labels.valuePlaceholder : undefined}
          aria-label={isPlaceholder ? labels.newValue : labels.valueOf(rowName)}
          className="border-transparent hover:border-input"
        />
      </td>
      {hasDescription ? (
        <td className={cn("p-1", isMuted && "opacity-60")}>
          <Input
            value={entry.description}
            onChange={(event) => {
              onChange({ ...entry, description: event.target.value });
            }}
            placeholder={isPlaceholder ? labels.descriptionPlaceholder : undefined}
            aria-label={isPlaceholder ? labels.newDescription : labels.descriptionOf(rowName)}
            className="border-transparent hover:border-input dark:bg-transparent"
          />
        </td>
      ) : null}
      <td className="w-9 pr-1 align-middle">
        {isPlaceholder || hasFixedKeys ? null : (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            aria-label={labels.removeRow(rowName)}
            className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X aria-hidden />
          </Button>
        )}
      </td>
    </tr>
  );
}
