// zod/mini: this schema ships to the browser, where the full Zod API costs ~50 KB (performance.md).
import * as z from "zod/mini";

import {
  ACCENTS,
  DEFAULT_APPEARANCE,
  DENSITIES,
  MOTION_PREFERENCES,
  THEME_MODES,
  type Appearance,
} from "./settings.constants";

/**
 * Appearance as read from a cookie. Each field falls back to its default on its own, so one
 * stale or tampered value never resets the others.
 */
export const appearanceSchema = z.catch(
  z.object({
    theme: z.catch(z.enum(THEME_MODES), DEFAULT_APPEARANCE.theme),
    accent: z.catch(z.enum(ACCENTS), DEFAULT_APPEARANCE.accent),
    density: z.catch(z.enum(DENSITIES), DEFAULT_APPEARANCE.density),
    motion: z.catch(z.enum(MOTION_PREFERENCES), DEFAULT_APPEARANCE.motion),
  }),
  DEFAULT_APPEARANCE,
);

/**
 * Turns any persisted value into a valid {@link Appearance}.
 *
 * @param saved Untrusted data, typically the `appearance` field of the settings cookie.
 */
export function parseAppearance(saved: unknown): Appearance {
  return appearanceSchema.parse(saved ?? {});
}
