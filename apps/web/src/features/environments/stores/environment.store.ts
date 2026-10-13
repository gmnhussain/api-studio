import { create } from "zustand";

import {
  sortBySortKey,
  type Environment,
  type EnvironmentId,
  type WorkspaceId,
} from "@api-studio/core";

/** Where loading the active workspace's environments stands. */
export type EnvironmentLoadStatus = "idle" | "loading" | "ready" | "failed";

export type EnvironmentState = {
  workspaceId: WorkspaceId | null;
  status: EnvironmentLoadStatus;
  /** The workspace's environments, in sort order. */
  environments: Environment[];
};

export type EnvironmentActions = {
  startLoading: (workspaceId: WorkspaceId) => void;
  setLoaded: (environments: readonly Environment[]) => void;
  setFailed: () => void;
  upsertEnvironment: (environment: Environment) => void;
  removeEnvironment: (environmentId: EnvironmentId) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialEnvironmentState(): EnvironmentState {
  return { workspaceId: null, status: "idle", environments: [] };
}

/** The active workspace's environments (ADR-0004); the environment service writes through. */
export const useEnvironmentStore = create<EnvironmentState & EnvironmentActions>()((set) => ({
  ...getInitialEnvironmentState(),
  startLoading: (workspaceId) => {
    set({ workspaceId, status: "loading", environments: [] });
  },
  setLoaded: (environments) => {
    set({ status: "ready", environments: sortBySortKey(environments) });
  },
  setFailed: () => {
    set({ status: "failed" });
  },
  upsertEnvironment: (environment) => {
    set((state) => ({
      environments: sortBySortKey([
        ...state.environments.filter((existing) => existing.id !== environment.id),
        environment,
      ]),
    }));
  },
  removeEnvironment: (environmentId) => {
    set((state) => ({
      environments: state.environments.filter((environment) => environment.id !== environmentId),
    }));
  },
}));
