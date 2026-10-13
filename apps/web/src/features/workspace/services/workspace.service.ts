import {
  asId,
  createWorkspace as buildWorkspace,
  currentTimestamp,
  err,
  nameSchema,
  ok,
  type EnvironmentId,
  type IsoDateTime,
  type Result,
  type Workspace,
  type WorkspaceId,
} from "@api-studio/core";

import type { KeyValueStorage } from "@/lib/cookies/browser-cookie-storage";
import type { ChangeFeed } from "@/lib/db/change-feed";

import type { WorkspaceRepository } from "../repositories/workspace.repository";
import type { WorkspaceActions, WorkspaceState } from "../stores/workspace.store";
import { LAST_WORKSPACE_COOKIE, type WorkspaceError } from "../workspace.constants";

/** The store as the service uses it: read the state and call its actions. */
export type WorkspaceStoreApi = { getState: () => WorkspaceState & WorkspaceActions };

/** Everything the service needs, injected so tests can use a real database and a fresh store. */
export type WorkspaceServiceDependencies = {
  repository: WorkspaceRepository;
  store: WorkspaceStoreApi;
  /** Where the last opened workspace is remembered; a cookie in the browser. */
  storage?: KeyValueStorage;
  changeFeed?: ChangeFeed;
  /** The current time; injectable so tests are deterministic. */
  now?: () => IsoDateTime;
};

export type WorkspaceService = ReturnType<typeof createWorkspaceService>;

/**
 * Workspace use cases (state-management.md#services-write-through-and-optimistic-updates). Every
 * change updates the store first, writes to IndexedDB, and rolls back if the write fails.
 * Expected failures are returned as a {@link Result}; the caller shows a message for each
 * {@link WorkspaceError}.
 */
export function createWorkspaceService({
  repository,
  store,
  storage,
  changeFeed,
  now = currentTimestamp,
}: WorkspaceServiceDependencies) {
  let loading: Promise<Result<readonly Workspace[], WorkspaceError>> | undefined;

  const actions = () => store.getState();
  const findWorkspace = (workspaceId: WorkspaceId) =>
    actions().workspaces.find((workspace) => workspace.id === workspaceId);

  const parseName = (name: string): string | null => {
    const result = nameSchema.safeParse(name);
    return result.success ? result.data : null;
  };

  return {
    /**
     * Reads every workspace into the store, creating the first one on first run. Concurrent
     * callers share one load.
     *
     * @param defaultName Name of the workspace created on first run, from the message catalog.
     */
    loadWorkspaces: (defaultName: string) => {
      loading ??= (async () => {
        actions().setStatus("loading");
        try {
          let workspaces = await repository.getAll();
          if (workspaces.length === 0) {
            const first = buildWorkspace({ name: defaultName, now: now() });
            await repository.put(first);
            workspaces = [first];
          }
          actions().setWorkspaces(workspaces);
          actions().setStatus("ready");
          return ok(workspaces);
        } catch {
          actions().setStatus("failed");
          loading = undefined;
          return err("storage" as const);
        }
      })();
      return loading;
    },

    /** Creates a workspace and returns it. */
    createWorkspace: async (name: string): Promise<Result<Workspace, WorkspaceError>> => {
      const validName = parseName(name);
      if (validName === null) return err("invalid_name");
      const workspace = buildWorkspace({ name: validName, now: now() });
      actions().upsertWorkspace(workspace);
      try {
        await repository.put(workspace);
        return ok(workspace);
      } catch {
        actions().removeWorkspace(workspace.id);
        return err("storage");
      }
    },

    /** Renames a workspace. */
    renameWorkspace: async (
      workspaceId: WorkspaceId,
      name: string,
    ): Promise<Result<Workspace, WorkspaceError>> => {
      const previous = findWorkspace(workspaceId);
      if (!previous) return err("not_found");
      const validName = parseName(name);
      if (validName === null) return err("invalid_name");
      if (validName === previous.name) return ok(previous);
      const renamed = { ...previous, name: validName, updatedAt: now() };
      actions().upsertWorkspace(renamed);
      try {
        await repository.put(renamed);
        return ok(renamed);
      } catch {
        actions().upsertWorkspace(previous);
        return err("storage");
      }
    },

    /** Deletes a workspace and everything in it. The last workspace cannot be deleted. */
    deleteWorkspace: async (workspaceId: WorkspaceId): Promise<Result<null, WorkspaceError>> => {
      const previous = findWorkspace(workspaceId);
      if (!previous) return err("not_found");
      if (actions().workspaces.length <= 1) return err("last_workspace");
      actions().removeWorkspace(workspaceId);
      try {
        await repository.deleteWithContents(workspaceId);
        if (storage?.getItem(LAST_WORKSPACE_COOKIE) === workspaceId) {
          storage.removeItem(LAST_WORKSPACE_COOKIE);
        }
        return ok(null);
      } catch {
        actions().upsertWorkspace(previous);
        return err("storage");
      }
    },

    /** Sets (or clears, with `null`) the environment a workspace's requests resolve against. */
    setActiveEnvironment: async (
      workspaceId: WorkspaceId,
      environmentId: EnvironmentId | null,
    ): Promise<Result<Workspace, WorkspaceError>> => {
      const previous = findWorkspace(workspaceId);
      if (!previous) return err("not_found");
      if (previous.activeEnvironmentId === environmentId) return ok(previous);
      const updated = { ...previous, activeEnvironmentId: environmentId, updatedAt: now() };
      actions().upsertWorkspace(updated);
      try {
        await repository.put(updated);
        return ok(updated);
      } catch {
        actions().upsertWorkspace(previous);
        return err("storage");
      }
    },

    /** Marks the workspace the studio shows and remembers it for the next visit to `/`. */
    openWorkspace: (workspaceId: WorkspaceId) => {
      actions().setActiveWorkspaceId(workspaceId);
      storage?.setItem(LAST_WORKSPACE_COOKIE, workspaceId);
    },

    /** Forgets the remembered workspace if it is this one, so `/` stops redirecting to it. */
    forgetWorkspace: (workspaceId: WorkspaceId) => {
      if (storage?.getItem(LAST_WORKSPACE_COOKIE) === workspaceId) {
        storage.removeItem(LAST_WORKSPACE_COOKIE);
      }
    },

    /** The workspace `/` should open: the last one opened here if it still exists, else the first. */
    pickWorkspaceToOpen: (): Workspace | undefined => {
      const { workspaces } = actions();
      const lastId = storage?.getItem(LAST_WORKSPACE_COOKIE);
      return workspaces.find((workspace) => workspace.id === lastId) ?? workspaces[0];
    },

    /**
     * Keeps the store in step with other tabs: re-reads workspaces they changed. Returns a
     * function that stops listening.
     */
    syncWithOtherTabs: (): (() => void) => {
      if (!changeFeed) return () => undefined;
      return changeFeed.subscribe((change) => {
        if (change.table !== "workspaces") return;
        void Promise.all(
          change.ids.map(async (changedId) => {
            const id = asId<"WorkspaceId">(changedId);
            const workspace = await repository.get(id);
            if (workspace) actions().upsertWorkspace(workspace);
            else actions().removeWorkspace(id);
          }),
        );
      });
    },
  };
}
