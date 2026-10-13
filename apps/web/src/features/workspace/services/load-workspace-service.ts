import type { WorkspaceService } from "./workspace.service";

/**
 * Loads the workspace service and its IndexedDB code in their own chunk, after the shell has
 * painted (performance.md#strategies).
 */
export async function loadWorkspaceService(): Promise<WorkspaceService> {
  const { getWorkspaceService } = await import("./workspace-service-instance");
  return getWorkspaceService();
}
