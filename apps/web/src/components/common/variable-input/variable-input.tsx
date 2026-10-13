"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { useRef, useState, type KeyboardEventHandler, type ReactNode, type RefObject } from "react";

import type { VariableMap } from "@api-studio/core";

import { cn } from "@/lib/utils";

import { getCompletionOptions, type CompletionOption } from "./input-completion";
import { VariableHighlight } from "./variable-highlight";

/** Props for {@link VariableInput}. */
export type VariableInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** The variables in scope: they are highlighted and offered after `{{`. */
  variables: VariableMap;
  /** Whole-value suggestions offered while typing, such as header names. */
  suggestions?: readonly string[];
  /** Renders each variable option's detail (its value or a mask, and its scope). */
  renderVariableDetail?: (option: Extract<CompletionOption, { kind: "variable" }>) => ReactNode;
  /** Masks the value like a password field; highlighting and completion are off meanwhile. */
  isMasked?: boolean;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-invalid"?: boolean;
  /** The input element, for focusing it (`Mod+L` focuses the URL bar). */
  inputRef?: RefObject<HTMLInputElement | null>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  /** Text size and padding come from here, so mirror and input always match. */
  className?: string;
};

/** Text metrics shared by the input and its highlight mirror; they must match exactly. */
const TEXT_METRICS = "px-2.5 font-mono text-sm";

/**
 * A single-line input with `{{variable}}` highlighting and autocomplete (F-02, F-28), used by the
 * URL bar and every table cell. The value is drawn by a mirror under a transparent input, so
 * native editing, selection and IME input keep working. Completion follows the WAI-ARIA combobox
 * pattern (Base UI Autocomplete): arrows move, Enter or Tab picks, Escape closes.
 */
export function VariableInput({
  value,
  onValueChange,
  variables,
  suggestions,
  renderVariableDetail,
  isMasked = false,
  className,
  inputRef,
  onKeyDown,
  ...inputProps
}: VariableInputProps) {
  const ownInputRef = useRef<HTMLInputElement | null>(null);
  const localInputRef = inputRef ?? ownInputRef;
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState(value.length);
  const [isFocused, setFocused] = useState(false);
  const [isDismissed, setDismissed] = useState(false);

  const options = isMasked ? [] : getCompletionOptions({ value, caret, variables, suggestions });
  const isOpen = isFocused && !isDismissed && options.length > 0;

  /** Reads the caret and keeps the mirror scrolled like the input. */
  const syncWithInput = () => {
    const input = localInputRef.current;
    if (!input) return;
    setCaret(input.selectionStart ?? input.value.length);
    if (mirrorRef.current) mirrorRef.current.scrollLeft = input.scrollLeft;
  };

  const handleValueChange = (next: string, reason: string) => {
    const picked = options.find((option) => option.nextValue === next);
    onValueChange(next);
    if (reason === "item-press" && picked) {
      setCaret(picked.caret);
      requestAnimationFrame(() => {
        localInputRef.current?.setSelectionRange(picked.caret, picked.caret);
        syncWithInput();
      });
    } else {
      setDismissed(false);
    }
  };

  return (
    <Autocomplete.Root
      items={options}
      filteredItems={options}
      mode="none"
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setDismissed(true);
      }}
      value={value}
      onValueChange={(next, details) => {
        handleValueChange(next, details.reason);
      }}
      itemToStringValue={(option) => option.nextValue}
      autoHighlight
    >
      <div
        data-slot="variable-input"
        className={cn(
          "relative flex h-8 w-full min-w-0 items-center rounded-md border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring has-aria-invalid:border-destructive dark:bg-input/30",
          className,
        )}
      >
        {isMasked ? null : (
          <VariableHighlight
            ref={mirrorRef}
            value={value}
            variables={variables}
            className={cn("absolute inset-0 flex items-center", TEXT_METRICS)}
          />
        )}
        <Autocomplete.Input
          ref={localInputRef}
          type={isMasked ? "password" : "text"}
          spellCheck={false}
          autoComplete="off"
          onFocus={() => {
            setFocused(true);
            syncWithInput();
          }}
          onBlur={() => {
            setFocused(false);
          }}
          onSelect={syncWithInput}
          onScroll={syncWithInput}
          onKeyDown={onKeyDown}
          className={cn(
            "relative size-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground",
            TEXT_METRICS,
            isMasked ? "text-foreground" : "text-transparent caret-foreground",
          )}
          {...inputProps}
        />
      </div>
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} align="start" className="isolate z-50">
          <Autocomplete.Popup className="max-h-64 w-(--anchor-width) min-w-56 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-popover">
            <Autocomplete.List>
              {(option: CompletionOption) => (
                <Autocomplete.Item
                  key={option.id}
                  value={option}
                  className="flex cursor-default items-center justify-between gap-3 rounded-md px-2 py-1 text-sm select-none data-highlighted:bg-surface-hover"
                >
                  <span className="truncate font-mono">{option.label}</span>
                  {option.kind === "variable" && renderVariableDetail ? (
                    <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      {renderVariableDetail(option)}
                    </span>
                  ) : null}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
