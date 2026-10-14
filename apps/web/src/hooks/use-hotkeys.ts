"use client";

import { useEffect, useEffectEvent, useMemo } from "react";

import { matchesKeyBinding, parseKeyBinding, type KeyBinding } from "@/lib/keyboard/key-binding";

import { useIsApplePlatform } from "./use-is-apple-platform";

/** One binding and what it does. */
export type HotkeyEntry = { binding: KeyBinding; onPress: (event: KeyboardEvent) => void };

/**
 * Like `useHotkey`, for a list of bindings with one listener: the first matching entry runs and
 * the browser's own action is prevented. Nothing fires while an IME is composing. The bindings
 * should stay the same between renders; the handlers may change freely.
 */
export function useHotkeys(entries: readonly HotkeyEntry[], { enabled = true } = {}): void {
  const isApplePlatform = useIsApplePlatform();
  const bindingsKey = entries.map((entry) => entry.binding).join("\n");
  const parsed = useMemo(
    () => bindingsKey.split("\n").filter(Boolean).map(parseKeyBinding),
    [bindingsKey],
  );
  const handlePress = useEffectEvent((index: number, event: KeyboardEvent) => {
    entries[index]?.onPress(event);
  });

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      const index = parsed.findIndex((binding) =>
        matchesKeyBinding(event, binding, isApplePlatform),
      );
      if (index === -1) return;
      event.preventDefault();
      handlePress(index, event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, isApplePlatform, parsed]);
}
