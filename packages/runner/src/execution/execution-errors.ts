import type { ExecutionError, ExecutionErrorCode } from "@api-studio/core";

import { isTimeoutReason } from "./execution-signal";

/** System and undici error codes, mapped to what the user needs to know. */
const CODE_MAP: Readonly<Record<string, ExecutionErrorCode>> = {
  ENOTFOUND: "DNS",
  EAI_AGAIN: "DNS",
  EAI_FAIL: "DNS",
  EAI_NONAME: "DNS",
  ECONNREFUSED: "NETWORK",
  ECONNRESET: "NETWORK",
  EHOSTUNREACH: "NETWORK",
  ENETUNREACH: "NETWORK",
  EPIPE: "NETWORK",
  ETIMEDOUT: "TIMEOUT",
  UND_ERR_CONNECT_TIMEOUT: "TIMEOUT",
  UND_ERR_HEADERS_TIMEOUT: "TIMEOUT",
  UND_ERR_BODY_TIMEOUT: "TIMEOUT",
  UND_ERR_SOCKET: "NETWORK",
  UND_ERR_CLOSED: "NETWORK",
  UND_ERR_INVALID_ARG: "INVALID_REQUEST",
  ERR_INVALID_CHAR: "INVALID_REQUEST",
  ERR_INVALID_HTTP_TOKEN: "INVALID_REQUEST",
  BLOCKED_ADDRESS: "BLOCKED_ADDRESS",
};

/** Certificate and handshake failures (Node and OpenSSL codes). */
const TLS_CODE_PATTERN =
  /^(ERR_TLS_|ERR_SSL_|CERT_|UNABLE_TO_|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|HOSTNAME_MISMATCH|ERR_OSSL_)/;

/** The `code` of an error, or of the error that caused it (undici wraps socket errors). */
function errorCode(error: unknown): string | undefined {
  for (let current: unknown = error, depth = 0; current && depth < 5; depth += 1) {
    if (typeof current === "object" && "code" in current && typeof current.code === "string") {
      return current.code;
    }
    current = typeof current === "object" && "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Turns what a failed execution threw into an {@link ExecutionError}. An aborted signal decides
 * between a timeout and a cancel, whatever error the abort surfaced as.
 */
export function toExecutionError(error: unknown, signal: AbortSignal): ExecutionError {
  if (signal.aborted) {
    return isTimeoutReason(signal.reason)
      ? { code: "TIMEOUT", message: "The request took longer than its timeout" }
      : { code: "ABORTED", message: "The request was cancelled" };
  }
  const code = errorCode(error);
  if (code !== undefined) {
    const mapped = CODE_MAP[code];
    if (mapped) return { code: mapped, message: `${code}: ${message(error)}` };
    if (TLS_CODE_PATTERN.test(code)) return { code: "TLS", message: `${code}: ${message(error)}` };
  }
  return { code: "NETWORK", message: message(error) };
}
