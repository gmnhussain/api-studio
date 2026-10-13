"use client";

import { useMemo } from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useIsApplePlatform } from "@/hooks/use-is-apple-platform";
import { formatKeyBinding, parseKeyBinding, type KeyBinding } from "@/lib/keyboard/key-binding";
import { cn } from "@/lib/utils";

/** Props for {@link ShortcutHint}. */
export type ShortcutHintProps = {
  /** A binding such as `"Mod+B"`, normally from `config/keymap.ts`. */
  binding: KeyBinding;
  className?: string;
};

/**
 * Shows a key binding as keyboard keys with platform symbols (⌘ on macOS, Ctrl elsewhere).
 * Decorative next to a labelled control; screen readers get the shortcut from `aria-keyshortcuts`
 * on the control itself.
 */
export function ShortcutHint({ binding, className }: ShortcutHintProps) {
  const isApplePlatform = useIsApplePlatform();
  const parts = useMemo(
    () => formatKeyBinding(parseKeyBinding(binding), isApplePlatform),
    [binding, isApplePlatform],
  );

  return (
    <KbdGroup aria-hidden className={cn("font-sans", className)}>
      {parts.map((part) => (
        <Kbd key={part}>{part}</Kbd>
      ))}
    </KbdGroup>
  );
}
