"use client";

import type { LucideIcon } from "lucide-react";

import { ShortcutHint } from "@/components/common/shortcut-hint";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsApplePlatform } from "@/hooks/use-is-apple-platform";
import { parseKeyBinding, toAriaKeyShortcuts, type KeyBinding } from "@/lib/keyboard/key-binding";

/** Props for {@link PanelToggleButton}. */
export type PanelToggleButtonProps = {
  icon: LucideIcon;
  /** The action the button performs now, e.g. "Hide console". */
  label: string;
  isOpen: boolean;
  /** Id of the region the button shows and hides. */
  controls: string;
  binding: KeyBinding;
  onToggle: () => void;
};

/**
 * An icon button that shows or hides a studio region, with its shortcut in the tooltip and in
 * `aria-keyshortcuts`. `aria-expanded` tells assistive technology whether the region is open.
 */
export function PanelToggleButton({
  icon: Icon,
  label,
  isOpen,
  controls,
  binding,
  onToggle,
}: PanelToggleButtonProps) {
  const isApplePlatform = useIsApplePlatform();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-expanded={isOpen}
            aria-controls={controls}
            aria-keyshortcuts={toAriaKeyShortcuts(parseKeyBinding(binding), isApplePlatform)}
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground aria-expanded:text-foreground"
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent className="gap-2">
        {label}
        <ShortcutHint binding={binding} />
      </TooltipContent>
    </Tooltip>
  );
}
