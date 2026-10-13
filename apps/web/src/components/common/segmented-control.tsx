"use client";

import type { ReactNode } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/** One choice of a {@link SegmentedControl}. */
export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  /** Decorative leading content, such as an icon or a colour swatch. */
  icon?: ReactNode;
};

/** Props for {@link SegmentedControl}. */
export type SegmentedControlProps<Value extends string> = {
  value: Value;
  options: readonly SegmentedOption<Value>[];
  onValueChange: (value: Value) => void;
  /** Id of the visible label that names the control. */
  "aria-labelledby": string;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * A compact, exclusive choice (Pretty / Raw / Preview; Dark / Light / System). Exactly one option
 * is always selected: pressing the selected option again keeps it. Arrow keys move between
 * options (Base UI toggle group).
 */
export function SegmentedControl<Value extends string>({
  value,
  options,
  onValueChange,
  className,
  ...ariaProps
}: SegmentedControlProps<Value>) {
  const handleValueChange = (values: unknown[]) => {
    const next = options.find((option) => values.includes(option.value));
    if (next) onValueChange(next.value);
  };

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={handleValueChange}
      variant="outline"
      size="sm"
      spacing={0}
      className={cn("bg-surface", className)}
      {...ariaProps}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="gap-1.5 px-3 text-xs data-pressed:bg-surface-selected data-pressed:text-foreground"
        >
          {option.icon}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
