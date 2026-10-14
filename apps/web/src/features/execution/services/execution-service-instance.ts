import { useConsoleStore } from "@/features/console";
import { useTabsStore } from "@/features/tabs";
import { getDatabase } from "@/lib/db/database";

import { createExecutionService, type ExecutionService } from "./execution.service";
import { executors, registerBuiltInExecutors } from "../lib/executor-registry";
import { createCookieJarRepository } from "../repositories/cookie-jar.repository";
import { useCookieJarStore } from "../stores/cookie-jar.store";
import { useExecutionStore } from "../stores/execution.store";
import { useExecutorPreferenceStore } from "../stores/executor-preference.store";

let instance: ExecutionService | undefined;

/**
 * The app's execution service, created on first use. It sends with the executor the user picked
 * (the proxy when that one is missing) and forgets executions of tabs as they close. Import this
 * module only through `loadExecutionService`.
 */
export function getExecutionService(): ExecutionService {
  if (!instance) {
    registerBuiltInExecutors();
    const service = createExecutionService({
      store: useExecutionStore,
      cookieJarStore: useCookieJarStore,
      cookieJarRepository: createCookieJarRepository(getDatabase()),
      getExecutor: () => {
        const preferred = executors.get(useExecutorPreferenceStore.getState().executorId);
        const fallback = executors.get("proxy");
        const executor = preferred ?? fallback;
        if (!executor) throw new Error("No executor is registered");
        return executor;
      },
      log: (entry) => {
        useConsoleStore.getState().append(entry);
      },
    });
    useTabsStore.subscribe((state, previous) => {
      if (state.tabs === previous.tabs) return;
      const open = new Set(state.tabs.map((tab) => tab.id));
      const closed = previous.tabs.map((tab) => tab.id).filter((tabId) => !open.has(tabId));
      if (closed.length > 0) service.forgetTabs(closed);
    });
    instance = service;
  }
  return instance;
}
