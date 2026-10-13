/** Sidebar sections in rail order (docs/design/layout-and-interaction.md#shell). */
export const SIDEBAR_SECTIONS = ["collections", "history", "environments", "variables"] as const;
export type SidebarSectionId = (typeof SIDEBAR_SECTIONS)[number];

export const DEFAULT_SIDEBAR_SECTION: SidebarSectionId = "collections";

/**
 * Resizable panel groups of the studio. The editor split has one group per orientation, so the
 * side-by-side and stacked layouts each remember their own sizes.
 */
export const PANEL_GROUPS = [
  "workbench",
  "center",
  "editors-horizontal",
  "editors-vertical",
] as const;
export type PanelGroupId = (typeof PANEL_GROUPS)[number];

/** Panel ids; a layout maps these to a percentage of their group. */
export const PANELS = {
  sidebar: "sidebar",
  center: "center",
  editors: "editors",
  console: "console",
  request: "request",
  response: "response",
} as const;
export type PanelId = (typeof PANELS)[keyof typeof PANELS];

/**
 * Panel size constraints. Numbers are pixels and strings are percentages
 * (react-resizable-panels v4); sizes follow design-system.md#spacing-sizing-and-shape.
 */
export const PANEL_SIZES = {
  sidebar: { defaultSize: 280, minSize: 220, maxSize: 480 },
  console: { defaultSize: 200, minSize: 120, maxSize: "60%" },
  request: { minSize: 320 },
  response: { defaultSize: "45%", minSize: 280 },
  /** When stacked, both editors share the height, so their minimums are heights. */
  stackedRequest: { minSize: 140 },
  stackedResponse: { defaultSize: "50%", minSize: 140 },
} as const;

/** Cookie that persists the UI store, read by the workspace route on the server (ADR-0011). */
export const LAYOUT_COOKIE = "api-studio.layout";

/** Element ids that controls point at with `aria-controls`. */
export const SHELL_REGION_IDS = {
  sidebar: "studio-sidebar",
  console: "studio-console",
  response: "studio-response",
} as const;
