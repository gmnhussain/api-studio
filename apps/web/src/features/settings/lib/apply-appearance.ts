import {
  APPEARANCE_ATTRIBUTES,
  DARK_SCHEME_QUERY,
  type Appearance,
  type ResolvedTheme,
  type ThemeMode,
} from "../settings.constants";

/**
 * Resolves `system` to the operating system's colour scheme.
 */
export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}

/**
 * Writes the appearance onto `<html>`: the `dark` class (which also sets `color-scheme`) and one
 * data attribute per setting. Colours switch in one frame (no transition) when the theme changes.
 * The settings boot script does the same before the first paint; keep the two in step.
 *
 * @returns The colour scheme now shown.
 */
export function applyAppearance(
  appearance: Appearance,
  root: HTMLElement = document.documentElement,
): ResolvedTheme {
  for (const key of Object.keys(APPEARANCE_ATTRIBUTES) as (keyof Appearance)[]) {
    root.setAttribute(APPEARANCE_ATTRIBUTES[key], appearance[key]);
  }

  const resolvedTheme = resolveTheme(appearance.theme);
  const isDark = resolvedTheme === "dark";
  if (root.classList.contains("dark") !== isDark) {
    root.classList.add("disable-transitions");
    root.classList.toggle("dark", isDark);
    requestAnimationFrame(() => {
      root.classList.remove("disable-transitions");
    });
  }
  return resolvedTheme;
}

/**
 * Calls `onChange` whenever the operating system switches between light and dark.
 *
 * @returns A function that stops listening.
 */
export function subscribeToSystemTheme(onChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(DARK_SCHEME_QUERY);
  mediaQueryList.addEventListener("change", onChange);
  return () => {
    mediaQueryList.removeEventListener("change", onChange);
  };
}
