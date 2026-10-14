"use client";

import { useSyncExternalStore } from "react";

/** The class the appearance settings put on `<html>` in dark mode. */
const DARK_THEME_CLASS = "dark";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => {
    observer.disconnect();
  };
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains(DARK_THEME_CLASS);
}

/** The server renders the default theme, dark (settings.constants.ts). */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Whether the app shows its dark theme right now, following theme changes. For content the
 * design tokens cannot reach, such as a sandboxed preview document.
 */
export function useIsDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
