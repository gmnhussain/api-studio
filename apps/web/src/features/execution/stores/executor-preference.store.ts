import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EXECUTOR_IDS, type ExecutorId } from "@api-studio/core";

/** Storage key of the executor preference. */
export const EXECUTOR_PREFERENCE_STORAGE_KEY = "api-studio.executor";
const EXECUTOR_PREFERENCE_VERSION = 1;

export type ExecutorPreferenceState = {
  /** How requests are sent: through the proxy (default) or straight from the browser. */
  executorId: ExecutorId;
};

export type ExecutorPreferenceActions = {
  setExecutorId: (executorId: ExecutorId) => void;
};

/** Keeps only a known executor from storage, so a stale value falls back to the proxy. */
function migrateExecutorPreference(persisted: unknown): ExecutorPreferenceState {
  const executorId =
    typeof persisted === "object" && persisted !== null && "executorId" in persisted
      ? EXECUTOR_IDS.find((id) => id === persisted.executorId)
      : undefined;
  return { executorId: executorId ?? "proxy" };
}

/**
 * Which executor sends requests (request-execution.md#executor-contract), remembered in this
 * browser. Only the client needs it, so `localStorage` is enough; it is read after mount.
 */
export const useExecutorPreferenceStore = create<
  ExecutorPreferenceState & ExecutorPreferenceActions
>()(
  persist(
    (set) => ({
      executorId: "proxy",
      setExecutorId: (executorId) => {
        set({ executorId });
      },
    }),
    {
      name: EXECUTOR_PREFERENCE_STORAGE_KEY,
      version: EXECUTOR_PREFERENCE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateExecutorPreference,
      merge: (persisted, current) => ({ ...current, ...migrateExecutorPreference(persisted) }),
      // Read after mount (useExecutorPreference), so server and first client render agree.
      skipHydration: true,
    },
  ),
);
