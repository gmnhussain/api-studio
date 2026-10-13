import { create } from "zustand";

import type { Workspace, WorkspaceId } from "@api-studio/core";

/** Where the workspace list is in its life: not loaded, loading, ready, or failed to load. */
export type WorkspaceLoadStatus = "idle" | "loading" | "ready" | "failed";

export type WorkspaceState = {
  status: WorkspaceLoadStatus;
  /** Every workspace, in creation order. */
  workspaces: Workspace[];
  /** The workspace the open studio shows; set from the route. */
  activeWorkspaceId: WorkspaceId | null;
};

export type WorkspaceActions = {
  setStatus: (status: WorkspaceLoadStatus) => void;
  setWorkspaces: (workspaces: readonly Workspace[]) => void;
  /** Adds a workspace or replaces the one with the same id, keeping creation order. */
  upsertWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: WorkspaceId) => void;
  setActiveWorkspaceId: (workspaceId: WorkspaceId | null) => void;
};

function byCreation(workspaces: readonly Workspace[]): Workspace[] {
  return [...workspaces].sort((left, right) =>
    left.createdAt === right.createdAt
      ? left.id.localeCompare(right.id)
      : left.createdAt.localeCompare(right.createdAt),
  );
}

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialWorkspaceState(): WorkspaceState {
  return { status: "idle", workspaces: [], activeWorkspaceId: null };
}

/**
 * Workspaces in memory (ADR-0004). IndexedDB is the source of truth; the workspace service
 * writes through to it. A module-level store, because the server never renders this data.
 */
export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()((set) => ({
  ...getInitialWorkspaceState(),
  setStatus: (status) => {
    set({ status });
  },
  setWorkspaces: (workspaces) => {
    set({ workspaces: byCreation(workspaces) });
  },
  upsertWorkspace: (workspace) => {
    set((state) => ({
      workspaces: byCreation([
        ...state.workspaces.filter((existing) => existing.id !== workspace.id),
        workspace,
      ]),
    }));
  },
  removeWorkspace: (workspaceId) => {
    set((state) => ({
      workspaces: state.workspaces.filter((workspace) => workspace.id !== workspaceId),
    }));
  },
  setActiveWorkspaceId: (activeWorkspaceId) => {
    set({ activeWorkspaceId });
  },
}));
