import type { Route } from "next";

/** Settings sections that have a page (docs/product/features.md, F-37). */
export const SETTINGS_SECTIONS = ["appearance", "about"] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

/**
 * Builds every internal URL. Components never write paths as string literals, and typed routes
 * turn a path that does not exist into a type error.
 */
export const routes = {
  home: () => "/" as const,
  /**
   * Typed routes can only verify literal segments; a workspace id is a runtime value, so this is
   * the one place its path is asserted to match `app/workspaces/[workspaceId]`.
   */
  workspace: (workspaceId: string) =>
    `/workspaces/${encodeURIComponent(workspaceId)}` as Route<`/workspaces/${string}`>,
  settings: (section: SettingsSection = "appearance") => `/settings/${section}` as const,
};
