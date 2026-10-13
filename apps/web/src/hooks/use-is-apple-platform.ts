"use client";

import { useSyncExternalStore } from "react";

const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/i;

function subscribe(): () => void {
  return () => undefined;
}

function getSnapshot(): boolean {
  return APPLE_PLATFORM_PATTERN.test(navigator.platform || navigator.userAgent);
}

/** The server cannot know the platform; it renders the non-Apple labels and the client corrects them. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tells whether the user is on macOS or iOS, where `Mod` means ⌘. Safe during server rendering and
 * hydration: it starts as `false` and switches without a hydration mismatch.
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
