import {
  executionResultSchema,
  type ExecutionResult,
  type ExecutionRequest,
  type RequestExecutor,
} from "@api-studio/core";

/** The proxy endpoint (request-execution.md#proxy-endpoint). */
export const EXECUTIONS_ENDPOINT = "/api/v1/executions";

/**
 * Extra time the client waits beyond the request's own timeout: the proxy enforces the timeout
 * and answers with `TIMEOUT`; this only catches a proxy that never answers.
 */
const PROXY_GRACE_MILLISECONDS = 5000;

/**
 * Sends requests through the app's proxy (ADR-0003), so they leave exactly as written: no CORS,
 * forbidden headers allowed, redirects visible. The default executor.
 *
 * @param fetchImplementation Injected in tests; the browser's `fetch` otherwise.
 */
export function createProxyExecutor(
  fetchImplementation: typeof fetch = (input, init) => fetch(input, init),
): RequestExecutor {
  return {
    id: "proxy",
    capabilities: {
      canSetForbiddenHeaders: true,
      canReadRedirectChain: true,
      bypassesCors: true,
      measuresTimings: true,
    },
    execute: async (request, { signal, ...options }): Promise<ExecutionResult> => {
      const guard = AbortSignal.timeout(options.timeoutMilliseconds + PROXY_GRACE_MILLISECONDS);
      const body: ExecutionRequest = { request, options };
      let response: Response;
      try {
        response = await fetchImplementation(EXECUTIONS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.any([signal, guard]),
        });
      } catch (error) {
        if (signal.aborted) {
          return { outcome: "error", request, error: { code: "ABORTED", message: "Cancelled" } };
        }
        if (guard.aborted) {
          return {
            outcome: "error",
            request,
            error: { code: "TIMEOUT", message: "The proxy did not answer in time" },
          };
        }
        return {
          outcome: "error",
          request,
          error: {
            code: "PROXY_UNAVAILABLE",
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }

      if (!response.ok) {
        return {
          outcome: "error",
          request,
          error: {
            code: "PROXY_UNAVAILABLE",
            message: `The proxy answered ${String(response.status)}`,
          },
        };
      }
      const parsed = executionResultSchema.safeParse(await response.json().catch(() => null));
      return parsed.success
        ? parsed.data
        : {
            outcome: "error",
            request,
            error: { code: "PROXY_UNAVAILABLE", message: "The proxy sent an unexpected answer" },
          };
    },
  };
}
