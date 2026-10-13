"use client";

import { useEffect, useEffectEvent, useMemo } from "react";

import { matchesKeyBinding, parseKeyBinding, type KeyBinding } from "@/lib/keyboard/key-binding";

import { useIsApplePlatform } from "./use-is-apple-platform";

/** Options for {@link useHotkey}. */
export type HotkeyOptions = {
  /** Listen only while `true`; defaults to `true`. */
  enabled?: boolean;
};

/**
 * Runs `onPress` when the binding is pressed anywhere on the page. The browser's own action for
 * the keys is prevented, and nothing fires while an IME is composing text.
 *
 * @param binding A binding such as `"Mod+B"`, normally from `config/keymap.ts`.
 */
export function useHotkey(
  binding: KeyBinding,
  onPress: (event: KeyboardEvent) => void,
  { enabled = true }: HotkeyOptions = {},
): void {
  const isApplePlatform = useIsApplePlatform();
  const parsedBinding = useMemo(() => parseKeyBinding(binding), [binding]);
  const handlePress = useEffectEvent(onPress);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      if (!matchesKeyBinding(event, parsedBinding, isApplePlatform)) return;
      event.preventDefault();
      handlePress(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, isApplePlatform, parsedBinding]);
}
