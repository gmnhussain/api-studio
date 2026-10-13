"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query. During server rendering and hydration it returns `false` (the wide,
 * desktop-first layout) and then switches without a hydration mismatch.
 *
 * @param query A media query, normally from `constants/breakpoints.ts`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => {
        mediaQueryList.removeEventListener("change", onChange);
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
