/**
 * Cookie naming the last workspace opened in this browser. A cookie, not `localStorage`, so `/`
 * can redirect on the server without waiting for IndexedDB (ADR-0011).
 */
export const LAST_WORKSPACE_COOKIE = "api-studio.last-workspace";

/** Why a workspace change was refused; each has a message in the `workspace` catalog. */
export const WORKSPACE_ERRORS = ["invalid_name", "not_found", "last_workspace", "storage"] as const;
export type WorkspaceError = (typeof WORKSPACE_ERRORS)[number];
