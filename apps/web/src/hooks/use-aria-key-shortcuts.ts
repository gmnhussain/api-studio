"use client";

import { parseKeyBinding, toAriaKeyShortcuts, type KeyBinding } from "@/lib/keyboard/key-binding";

import { useIsApplePlatform } from "./use-is-apple-platform";

/** A binding from the keymap in `aria-keyshortcuts` syntax for this platform. */
export function useAriaKeyShortcuts(binding: KeyBinding): string {
  const isApplePlatform = useIsApplePlatform();
  return toAriaKeyShortcuts(parseKeyBinding(binding), isApplePlatform);
}
