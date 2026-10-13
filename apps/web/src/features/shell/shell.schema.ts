import { z } from "zod";

import { DEFAULT_SIDEBAR_SECTION, PANEL_GROUPS, SIDEBAR_SECTIONS } from "./shell.constants";
import type { PanelLayouts, UiState } from "./stores/ui.store";

/** A panel group layout: panel id → percentage of the group (0–100). */
const layoutSchema = z.record(z.string(), z.number().min(0).max(100));

/** The outer shape of the layout cookie; each layout is validated on its own below. */
const uiStateSchema = z
  .object({
    sidebarSection: z.enum(SIDEBAR_SECTIONS).catch(DEFAULT_SIDEBAR_SECTION),
    layouts: z.record(z.string(), z.unknown()).catch({}),
  })
  .catch({ sidebarSection: DEFAULT_SIDEBAR_SECTION, layouts: {} });

/** The UI state before anything was saved. */
export const DEFAULT_UI_STATE: UiState = { sidebarSection: DEFAULT_SIDEBAR_SECTION, layouts: {} };

/**
 * Turns any persisted value into a valid {@link UiState}. Unknown panel groups are dropped and an
 * invalid layout or section falls back on its own, so one bad value never resets everything.
 *
 * @param saved Untrusted data, typically the `state` of the layout cookie.
 */
export function parseUiState(saved: unknown): UiState {
  const { sidebarSection, layouts } = uiStateSchema.parse(saved ?? {});
  const validLayouts: PanelLayouts = {};
  for (const groupId of PANEL_GROUPS) {
    const result = layoutSchema.safeParse(layouts[groupId]);
    if (result.success) validLayouts[groupId] = result.data;
  }
  return { sidebarSection, layouts: validLayouts };
}
