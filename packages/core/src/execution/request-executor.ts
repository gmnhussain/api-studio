import type { ExecuteOptions, ExecutionResult } from "./execution-result.schema";
import type { ResolvedRequest } from "./resolved-request.schema";

/** Transports that can send a request (request-execution.md#executor-contract). */
export const EXECUTOR_IDS = ["proxy", "browser"] as const;
export type ExecutorId = (typeof EXECUTOR_IDS)[number];

/** What a transport can and cannot do, so the UI can say so instead of showing wrong data. */
export type ExecutorCapabilities = {
  /** Whether headers browsers forbid (`Cookie`, `Host`, `Origin`, …) leave as written. */
  canSetForbiddenHeaders: boolean;
  /** Whether each redirect is visible, not only the final response. */
  canReadRedirectChain: boolean;
  /** Whether the target API needs no CORS headers. */
  bypassesCors: boolean;
  /** Whether time to first byte and download time are measured. */
  measuresTimings: boolean;
};

/**
 * Sends a resolved request. Expected failures (timeouts, DNS, refused connections, cancel) come
 * back as an `error` outcome; an executor throws only for bugs.
 */
export type RequestExecutor = {
  readonly id: ExecutorId;
  readonly capabilities: ExecutorCapabilities;
  execute: (
    request: ResolvedRequest,
    options: ExecuteOptions & { signal: AbortSignal },
  ) => Promise<ExecutionResult>;
};
