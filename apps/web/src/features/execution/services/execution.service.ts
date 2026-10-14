import {
  planRequest,
  updateCookieJar,
  type AuthConfig,
  type ExecuteOptions,
  type ExecutionResult,
  type HttpRequestDefinition,
  type RequestExecutor,
  type ResolvedRequest,
  type TabId,
  type VariableMap,
  type WorkspaceId,
} from "@api-studio/core";

import type { NewConsoleEntry } from "@/features/console";
import type { ObservableStore } from "@/lib/services/observable-store";

import type { CookieJarRepository } from "../repositories/cookie-jar.repository";
import type { CookieJarActions, CookieJarState } from "../stores/cookie-jar.store";
import type { ExecutionActions, ExecutionState } from "../stores/execution.store";

/** What sending a tab's request needs: the draft and what it resolves against. */
export type SendInput = {
  request: HttpRequestDefinition;
  variables: VariableMap;
  inheritedAuth: AuthConfig;
};

/** Everything the service needs, injected so tests can fake the network and the clock. */
export type ExecutionServiceDependencies = {
  store: ObservableStore<ExecutionState & ExecutionActions>;
  cookieJarStore: ObservableStore<CookieJarState & CookieJarActions>;
  cookieJarRepository: CookieJarRepository;
  /** The executor the user picked (proxy or browser). */
  getExecutor: () => RequestExecutor;
  /** Adds a console entry (the console feature's store). */
  log: (entry: NewConsoleEntry) => void;
  createExecutionId?: () => string;
  now?: () => Date;
};

export type ExecutionService = ReturnType<typeof createExecutionService>;

/** The URL to log: without its query when secrets went into the request (rule 7). */
function loggableUrl(url: string, usesSecrets: boolean): string {
  if (!usesSecrets) return url;
  const parsed = URL.parse(url);
  return parsed ? `${parsed.origin}${parsed.pathname}` : url;
}

/**
 * Sends requests (request-execution.md#pipeline): plans the draft into exactly what is sent,
 * runs it through the chosen executor, records the result for the tab, updates the cookie jar
 * and logs to the console. One execution per tab: sending again cancels the previous one.
 */
export function createExecutionService({
  store,
  cookieJarStore,
  cookieJarRepository,
  getExecutor,
  log,
  createExecutionId = () => crypto.randomUUID(),
  now = () => new Date(),
}: ExecutionServiceDependencies) {
  /** Abort handles of executions in flight; not state, since they are not serializable. */
  const controllers = new Map<TabId, AbortController>();
  /** The options each tab last sent with, so a retry repeats the exact request. */
  const lastOptions = new Map<TabId, ExecuteOptions>();

  const keepCookies = async (result: ExecutionResult) => {
    const { workspaceId, cookies } = cookieJarStore.getState();
    if (
      workspaceId === null ||
      result.outcome !== "response" ||
      result.response.cookies.length === 0
    ) {
      return;
    }
    const updated = updateCookieJar(cookies, result.response.cookies, now());
    cookieJarStore.getState().setJar(workspaceId, updated);
    await cookieJarRepository.put({
      workspaceId,
      cookies: updated,
      updatedAt: now().toISOString(),
    });
  };

  const logResult = (
    result: ExecutionResult,
    method: HttpRequestDefinition["method"],
    url: string,
  ) => {
    const response = result.outcome === "response" ? result.response : null;
    log({
      level: response === null ? "error" : response.status >= 400 ? "warning" : "info",
      at: now().toISOString(),
      kind: "execution",
      execution: {
        method,
        url,
        status: response?.status ?? null,
        totalMilliseconds: response?.timings.totalMilliseconds ?? null,
        errorCode: result.outcome === "error" ? result.error.code : null,
      },
    });
  };

  /** Runs an already planned request for a tab. */
  const run = async (
    tabId: TabId,
    request: ResolvedRequest,
    options: ExecuteOptions,
    loggedUrl: string,
  ): Promise<ExecutionResult> => {
    controllers.get(tabId)?.abort();
    const controller = new AbortController();
    controllers.set(tabId, controller);
    lastOptions.set(tabId, options);
    const executor = getExecutor();
    const executionId = createExecutionId();
    store.getState().start(tabId, {
      executionId,
      executorId: executor.id,
      startedAt: now().toISOString(),
      request,
    });

    const result = await executor.execute(request, { ...options, signal: controller.signal });
    if (controllers.get(tabId) === controller) controllers.delete(tabId);
    store.getState().finish(tabId, executionId, result);
    logResult(result, request.method, loggedUrl);
    await keepCookies(result).catch(() => undefined);
    return result;
  };

  return {
    /** Loads a workspace's cookie jar; requests sent from then on use it. */
    openWorkspace: async (workspaceId: WorkspaceId): Promise<void> => {
      const jar = await cookieJarRepository.get(workspaceId).catch(() => undefined);
      cookieJarStore.getState().setJar(workspaceId, jar?.cookies ?? []);
    },

    /** Plans and sends a tab's request; a request that cannot be built fails without sending. */
    send: async (tabId: TabId, input: SendInput): Promise<ExecutionResult> => {
      const { request } = input;
      const options: ExecuteOptions = request.settings;
      const planned = planRequest({
        request,
        variables: input.variables,
        inheritedAuth: input.inheritedAuth,
        cookieJar: cookieJarStore.getState().cookies,
        now: now(),
      });
      if (!planned.ok) {
        controllers.get(tabId)?.abort();
        const executionId = createExecutionId();
        const result: ExecutionResult = {
          outcome: "error",
          request: null,
          error:
            planned.error.code === "UNRESOLVED_VARIABLES"
              ? {
                  code: "UNRESOLVED_VARIABLES",
                  message: planned.error.names.join(", "),
                  variables: planned.error.names,
                }
              : {
                  code: "INVALID_REQUEST",
                  message: `${planned.error.reason}: ${planned.error.detail}`,
                },
        };
        store.getState().start(tabId, {
          executionId,
          executorId: getExecutor().id,
          startedAt: now().toISOString(),
          request: null,
        });
        store.getState().finish(tabId, executionId, result);
        logResult(result, request.method, request.url);
        return result;
      }
      return run(
        tabId,
        planned.value.request,
        options,
        loggableUrl(planned.value.request.url, planned.value.usesSecrets),
      );
    },

    /** Repeats a tab's last request exactly as sent, without resolving it again. */
    retry: async (tabId: TabId): Promise<ExecutionResult | null> => {
      const request = store.getState().executions[tabId]?.request;
      const options = lastOptions.get(tabId);
      if (!request || !options) return null;
      return run(tabId, request, options, loggableUrl(request.url, true));
    },

    /** Cancels a tab's execution in flight (`Esc`); its result is `ABORTED`. */
    cancel: (tabId: TabId): void => {
      controllers.get(tabId)?.abort();
    },

    /** Forgets the executions of closed tabs, cancelling any still in flight. */
    forgetTabs: (tabIds: readonly TabId[]): void => {
      for (const tabId of tabIds) {
        controllers.get(tabId)?.abort();
        controllers.delete(tabId);
        lastOptions.delete(tabId);
      }
      store.getState().clear(tabIds);
    },
  };
}
