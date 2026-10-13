/** Colour schemes; `system` follows the operating system. */
export const THEME_MODES = ["dark", "light", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** The colour scheme actually shown once `system` is resolved. */
export type ResolvedTheme = Exclude<ThemeMode, "system">;

/** Accent presets (design-system.md#accent-ion); `ion` is the brand default. */
export const ACCENTS = ["ion", "iris", "ember", "moss", "graphite"] as const;
export type Accent = (typeof ACCENTS)[number];

/** Spacing density; `compact` scales every spacing utility down. */
export const DENSITIES = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITIES)[number];

/** Motion preference; `reduce` adds to the OS setting and never overrides it. */
export const MOTION_PREFERENCES = ["system", "reduce"] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

/** Appearance settings, applied to `<html>` before the first paint (ADR-0011). */
export type Appearance = {
  theme: ThemeMode;
  accent: Accent;
  density: Density;
  motion: MotionPreference;
};

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "dark",
  accent: "ion",
  density: "comfortable",
  motion: "system",
};

/** Allowed values per appearance setting; the boot script validates the cookie against these. */
export const APPEARANCE_VALUES: { readonly [Key in keyof Appearance]: readonly Appearance[Key][] } =
  {
    theme: THEME_MODES,
    accent: ACCENTS,
    density: DENSITIES,
    motion: MOTION_PREFERENCES,
  };

/** The `<html>` attribute that carries each appearance setting, read by CSS variants. */
export const APPEARANCE_ATTRIBUTES: { readonly [Key in keyof Appearance]: string } = {
  theme: "data-theme-mode",
  accent: "data-accent",
  density: "data-density",
  motion: "data-motion",
};

/** Cookie that persists the settings store. */
export const SETTINGS_COOKIE = "api-studio.settings";

/** Media query for the operating system's dark mode. */
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** The `<html>` attributes for the default appearance; server HTML ships with these. */
export const DEFAULT_APPEARANCE_ATTRIBUTES: Readonly<Record<string, string>> = Object.fromEntries(
  (Object.keys(APPEARANCE_ATTRIBUTES) as (keyof Appearance)[]).map((key) => [
    APPEARANCE_ATTRIBUTES[key],
    DEFAULT_APPEARANCE[key],
  ]),
);
