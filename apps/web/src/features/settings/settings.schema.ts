import { z } from "zod";

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
export const appearanceSchema = z
  .object({
    theme: z.enum(THEME_MODES).catch(DEFAULT_APPEARANCE.theme),
    accent: z.enum(ACCENTS).catch(DEFAULT_APPEARANCE.accent),
    density: z.enum(DENSITIES).catch(DEFAULT_APPEARANCE.density),
    motion: z.enum(MOTION_PREFERENCES).catch(DEFAULT_APPEARANCE.motion),
  })
  .catch(DEFAULT_APPEARANCE);

/**
 * Turns any persisted value into a valid {@link Appearance}.
 *
 * @param saved Untrusted data, typically the `appearance` field of the settings cookie.
 */
export function parseAppearance(saved: unknown): Appearance {
  return appearanceSchema.parse(saved ?? {});
}
