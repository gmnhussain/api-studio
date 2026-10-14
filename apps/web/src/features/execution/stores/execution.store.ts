import { create } from "zustand";

import type { ExecutionResult, ExecutorId, ResolvedRequest, TabId } from "@api-studio/core";

/** Where a tab's execution stands. */
export type TabExecution = {
  /** Identifies one send; a late result of an older send is ignored. */
  executionId: string;
  status: "sending" | "done";
  executorId: ExecutorId;
  /** ISO time the send started. */
  startedAt: string;
  /** The request as sent, kept for retry; `null` when it could not be built. */
  request: ResolvedRequest | null;
  result: ExecutionResult | null;
};

export type ExecutionState = {
  /** The latest execution of each tab. */
  executions: Readonly<Record<TabId, TabExecution>>;
};

export type ExecutionActions = {
  start: (tabId: TabId, execution: Omit<TabExecution, "status" | "result">) => void;
  /** Records a result, unless a newer send of the tab has started meanwhile. */
  finish: (tabId: TabId, executionId: string, result: ExecutionResult) => void;
  clear: (tabIds: readonly TabId[]) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialExecutionState(): ExecutionState {
  return { executions: {} };
}

/**
 * The latest execution of each tab: in flight or finished, with its result. Memory only;
 * history (M6) keeps past executions. The abort handles live in the execution service, since
 * state stays serializable (state-management.md#store-shape).
 */
export const useExecutionStore = create<ExecutionState & ExecutionActions>()((set) => ({
  ...getInitialExecutionState(),
  start: (tabId, execution) => {
    set((state) => ({
      executions: {
        ...state.executions,
        [tabId]: { ...execution, status: "sending", result: null },
      },
    }));
  },
  finish: (tabId, executionId, result) => {
    set((state) => {
      const current = state.executions[tabId];
      if (current?.executionId !== executionId) return state;
      return {
        executions: { ...state.executions, [tabId]: { ...current, status: "done", result } },
      };
    });
  },
  clear: (tabIds) => {
    set((state) => {
      const removed = new Set<string>(tabIds);
      return {
        executions: Object.fromEntries(
          Object.entries(state.executions).filter(([tabId]) => !removed.has(tabId)),
        ),
      };
    });
  },
}));
