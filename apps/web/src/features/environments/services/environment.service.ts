import {
  createEnvironment as buildEnvironment,
  currentTimestamp,
  err,
  nameSchema,
  ok,
  sortKeyAfterLast,
  type Environment,
  type EnvironmentColor,
  type EnvironmentId,
  type IsoDateTime,
  type Result,
  type Variable,
  type WorkspaceId,
} from "@api-studio/core";

import { runOptimisticWrite } from "@/lib/services/optimistic-write";

import type { EnvironmentError } from "../environments.constants";
import type { EnvironmentRepository } from "../repositories/environment.repository";
import type { EnvironmentActions, EnvironmentState } from "../stores/environment.store";

/** The workspace operation environments need: clearing the active one when it is deleted. */
export type ActiveEnvironmentSetter = (
  workspaceId: WorkspaceId,
  environmentId: EnvironmentId | null,
) => Promise<unknown>;

/** Everything the service needs, injected so tests can use a real database and a fresh store. */
export type EnvironmentServiceDependencies = {
  repository: EnvironmentRepository;
  store: { getState: () => EnvironmentState & EnvironmentActions };
  /** Clears the workspace's active environment; the workspace service owns that field. */
  setActiveEnvironment: ActiveEnvironmentSetter;
  /** The active environment of the loaded workspace, read from the workspace store. */
  getActiveEnvironmentId: () => EnvironmentId | null;
  now?: () => IsoDateTime;
};

type Outcome<Value> = Promise<Result<Value, EnvironmentError>>;

export type EnvironmentService = ReturnType<typeof createEnvironmentService>;

/**
 * Environment use cases (F-27), optimistic like every service: the store first, IndexedDB second,
 * rolled back on failure. Deleting the active environment also clears it on the workspace.
 */
export function createEnvironmentService({
  repository,
  store,
  setActiveEnvironment,
  getActiveEnvironmentId,
  now = currentTimestamp,
}: EnvironmentServiceDependencies) {
  const state = () => store.getState();
  const find = (environmentId: EnvironmentId) =>
    state().environments.find((environment) => environment.id === environmentId);

  /** Saves a changed environment optimistically, restoring the previous one on failure. */
  const save = async (previous: Environment, next: Environment): Outcome<Environment> => {
    const result = await runOptimisticWrite({
      apply: () => {
        state().upsertEnvironment(next);
      },
      persist: () => repository.put(next),
      rollback: () => {
        state().upsertEnvironment(previous);
      },
    });
    return result.ok ? ok(next) : result;
  };

  return {
    /** Loads a workspace's environments into the store. */
    loadEnvironments: async (workspaceId: WorkspaceId): Outcome<null> => {
      state().startLoading(workspaceId);
      try {
        const environments = await repository.findBy("workspaceId", workspaceId);
        if (state().workspaceId === workspaceId) state().setLoaded(environments);
        return ok(null);
      } catch {
        state().setFailed();
        return err("storage");
      }
    },

    /** Creates an environment without variables, at the end of the list. */
    createEnvironment: async (name: string, color?: EnvironmentColor): Outcome<Environment> => {
      const { workspaceId } = state();
      if (!workspaceId) return err("no_workspace");
      const parsed = nameSchema.safeParse(name);
      if (!parsed.success) return err("invalid_name");
      const environment = buildEnvironment({
        workspaceId,
        name: parsed.data,
        sortKey: sortKeyAfterLast(state().environments),
        ...(color ? { color } : {}),
        now: now(),
      });
      const result = await runOptimisticWrite({
        apply: () => {
          state().upsertEnvironment(environment);
        },
        persist: () => repository.put(environment),
        rollback: () => {
          state().removeEnvironment(environment.id);
        },
      });
      return result.ok ? ok(environment) : result;
    },

    /** Renames an environment. */
    renameEnvironment: async (environmentId: EnvironmentId, name: string): Outcome<Environment> => {
      const previous = find(environmentId);
      if (!previous) return err("not_found");
      const parsed = nameSchema.safeParse(name);
      if (!parsed.success) return err("invalid_name");
      return save(previous, { ...previous, name: parsed.data, updatedAt: now() });
    },

    /** Replaces an environment's variables (the editor saves the whole table, F-28). */
    setVariables: async (
      environmentId: EnvironmentId,
      variables: readonly Variable[],
    ): Outcome<Environment> => {
      const previous = find(environmentId);
      if (!previous) return err("not_found");
      return save(previous, { ...previous, variables: [...variables], updatedAt: now() });
    },

    /** Deletes an environment; when it was active, the workspace is left without one. */
    deleteEnvironment: async (environmentId: EnvironmentId): Outcome<null> => {
      const previous = find(environmentId);
      if (!previous) return err("not_found");
      const result = await runOptimisticWrite({
        apply: () => {
          state().removeEnvironment(environmentId);
        },
        persist: () => repository.delete(environmentId),
        rollback: () => {
          state().upsertEnvironment(previous);
        },
      });
      if (result.ok && getActiveEnvironmentId() === environmentId) {
        await setActiveEnvironment(previous.workspaceId, null);
      }
      return result;
    },
  };
}
