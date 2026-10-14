"use client";

import { useEffect } from "react";

import type { ExecutorId } from "@api-studio/core";

import { useExecutorPreferenceStore } from "../stores/executor-preference.store";

/** The executor in use and a setter; the saved choice is read after mount. */
export function useExecutorPreference(): [ExecutorId, (executorId: ExecutorId) => void] {
  const executorId = useExecutorPreferenceStore((state) => state.executorId);
  const setExecutorId = useExecutorPreferenceStore((state) => state.setExecutorId);
  useEffect(() => {
    void useExecutorPreferenceStore.persist.rehydrate();
  }, []);
  return [executorId, setExecutorId];
}
