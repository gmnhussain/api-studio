"use client";

import type { TabId } from "@api-studio/core";

import { useExecutionStore, type TabExecution } from "../stores/execution.store";

/** The latest execution of a tab, or `undefined` when it has not sent anything yet. */
export function useTabExecution(tabId: TabId | null): TabExecution | undefined {
  return useExecutionStore((state) => (tabId === null ? undefined : state.executions[tabId]));
}
