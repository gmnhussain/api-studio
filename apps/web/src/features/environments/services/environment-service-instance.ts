import { loadWorkspaceService, useWorkspaceStore } from "@/features/workspace";
import { getDatabase } from "@/lib/db/database";
import { getSharedChangeFeed } from "@/lib/db/shared-change-feed";

import { createEnvironmentService, type EnvironmentService } from "./environment.service";
import { createEnvironmentRepository } from "../repositories/environment.repository";
import { useEnvironmentStore } from "../stores/environment.store";

let instance: EnvironmentService | undefined;

/** The active environment of the open workspace, as the workspace store has it. */
function getActiveEnvironmentId() {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore.getState();
  return (
    workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.activeEnvironmentId ?? null
  );
}

/**
 * The app's environment service, created on first use with the browser database. The active
 * environment belongs to the workspace, so changing it goes through the workspace service.
 * Import this module only through `loadEnvironmentService`.
 */
export function getEnvironmentService(): EnvironmentService {
  instance ??= createEnvironmentService({
    repository: createEnvironmentRepository(getDatabase(), { changeFeed: getSharedChangeFeed() }),
    store: useEnvironmentStore,
    setActiveEnvironment: async (workspaceId, environmentId) => {
      const workspaceService = await loadWorkspaceService();
      return workspaceService.setActiveEnvironment(workspaceId, environmentId);
    },
    getActiveEnvironmentId,
  });
  return instance;
}
