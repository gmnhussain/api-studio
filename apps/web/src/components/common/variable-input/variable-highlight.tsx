import type { Ref } from "react";

import { tokenizeTemplate, type VariableMap } from "@api-studio/core";

import { cn } from "@/lib/utils";

/** Props for {@link VariableHighlight}. */
export type VariableHighlightProps = {
  value: string;
  variables: VariableMap;
  /** The mirror scrolls with the input it sits under. */
  ref?: Ref<HTMLDivElement>;
  className?: string;
};

/**
 * The visible text of a {@link VariableInput}: the value drawn character for character under a
 * transparent input, with `{{references}}` tinted. Defined variables use the accent; unknown ones
 * the warning colour (design-system.md#semantic), so a typo shows before anything is sent.
 * Hidden from assistive technology, which reads the real input.
 */
export function VariableHighlight({ value, variables, ref, className }: VariableHighlightProps) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none overflow-hidden whitespace-pre", className)}
    >
      {tokenizeTemplate(value).map((token, index) =>
        token.type === "text" ? (
          <span key={index}>{token.value}</span>
        ) : (
          <span
            key={index}
            data-variable={variables.has(token.name) ? "defined" : "undefined"}
            className={cn(
              "rounded-sm",
              variables.has(token.name)
                ? "bg-primary-muted text-primary"
                : "bg-warning-muted text-warning",
            )}
          >
            {token.raw}
          </span>
        ),
      )}
    </div>
  );
}
