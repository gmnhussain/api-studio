/** `localStorage` key of the last workspace opened in this browser, which `/` reopens. */
export const LAST_WORKSPACE_STORAGE_KEY = "api-studio.last-workspace";

/** Why a workspace change was refused; each has a message in the `workspace` catalog. */
export const WORKSPACE_ERRORS = ["invalid_name", "not_found", "last_workspace", "storage"] as const;
export type WorkspaceError = (typeof WORKSPACE_ERRORS)[number];
