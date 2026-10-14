import { STATUS_CODES } from "node:http";
import { isIP } from "node:net";
import { performance } from "node:perf_hooks";

import { Agent, FormData, request as sendRequest } from "undici";

import {
  encodeResponseBody,
  measureBodyBytes,
  measureRequestBytes,
  parseSetCookie,
  type ExecuteOptions,
  type ExecutionResult,
  type HeaderPair,
  type RedirectHop,
  type ResolvedRequest,
  type ResponseCookie,
  type SerializedBody,
} from "@api-studio/core";

import { toExecutionError } from "./execution-errors";
import { createExecutionSignal } from "./execution-signal";
import { followRedirect, isRedirectStatus } from "./redirects";
import { decodeBody, readBody } from "./response-body";
import { isPrivateAddress } from "../network/address-policy";
import { createGuardedLookup } from "../network/guarded-lookup";

/** How the runner may be used: limits and the network policy (request-execution.md#security). */
export type RunnerConfig = {
  allowPrivateNetworks: boolean;
  /** Ports requests may go to; `null` allows any. */
  allowedPorts: readonly number[] | null;
  /** Response bodies are cut here and marked `truncated`. */
  maxResponseBytes: number;
  /** Request bodies above this are refused. */
  maxRequestBytes: number;
  /** Ceiling for any request's timeout. */
  maxTimeoutMilliseconds: number;
};

/** Sends resolved requests from Node: the engine behind the proxy and the future CLI. */
export type Runner = {
  execute: (
    request: ResolvedRequest,
    options: ExecuteOptions & { signal?: AbortSignal },
  ) => Promise<ExecutionResult>;
  /** Closes pooled connections. */
  close: () => Promise<void>;
};

/** HTTP/1.1, the only protocol the runner speaks so far (HTTP/2 needs `allowH2`). */
const HTTP_VERSION = "HTTP/1.1";
const CRLF_BYTES = 2;
const DEFAULT_PORTS: Readonly<Record<string, number>> = { "http:": 80, "https:": 443 };

function toFlatHeaders(headers: readonly HeaderPair[]): string[] {
  return headers.flatMap((header) => [header.name, header.value]);
}

function toRequestBody(body: SerializedBody): string | FormData | undefined {
  switch (body.kind) {
    case "none":
      return undefined;
    case "text":
      return body.text;
    case "form_data": {
      const form = new FormData();
      for (const part of body.parts) form.append(part.name, part.value);
      return form;
    }
  }
}

/** Response headers as ordered pairs; repeated headers (such as `Set-Cookie`) stay separate. */
function toHeaderPairs(headers: Record<string, string | string[] | undefined>): HeaderPair[] {
  return Object.entries(headers).flatMap(([name, value]) =>
    value === undefined
      ? []
      : (Array.isArray(value) ? value : [value]).map((item) => ({ name, value: item })),
  );
}

function headerValue(headers: readonly HeaderPair[], name: string): string | null {
  return headers.find((header) => header.name === name)?.value ?? null;
}

function measureResponseHeaders(
  status: number,
  statusText: string,
  headers: readonly HeaderPair[],
) {
  const startLine =
    Buffer.byteLength(`${HTTP_VERSION} ${String(status)} ${statusText}`) + CRLF_BYTES;
  return headers.reduce(
    (total, header) => total + Buffer.byteLength(`${header.name}: ${header.value}`) + CRLF_BYTES,
    startLine + CRLF_BYTES,
  );
}

/**
 * Creates a runner. Redirects are followed by hand, so each hop is recorded and checked against
 * the network policy; the guarded DNS lookup checks every address a socket connects to.
 */
export function createRunner(config: RunnerConfig): Runner {
  const allowedPorts = config.allowedPorts === null ? null : new Set(config.allowedPorts);
  const dispatcher = new Agent({
    connect: { lookup: createGuardedLookup({ allowPrivateNetworks: config.allowPrivateNetworks }) },
  });

  /** Refuses ports outside the list and blocked literal IPs; names are checked after DNS. */
  const refuseTarget = (url: URL): string | null => {
    const port = url.port === "" ? (DEFAULT_PORTS[url.protocol] ?? 0) : Number(url.port);
    if (allowedPorts !== null && !allowedPorts.has(port))
      return `Port ${String(port)} is not allowed`;
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (!config.allowPrivateNetworks && isIP(host) !== 0 && isPrivateAddress(host)) {
      return `Connecting to ${host} is not allowed`;
    }
    return null;
  };

  const execute: Runner["execute"] = async (request, { signal: cancelSignal, ...options }) => {
    if (measureBodyBytes(request.body) > config.maxRequestBytes) {
      return {
        outcome: "error",
        request,
        error: { code: "REQUEST_TOO_LARGE", message: "The request body is over the size limit" },
      };
    }
    const signal = createExecutionSignal({
      timeoutMilliseconds: Math.min(options.timeoutMilliseconds, config.maxTimeoutMilliseconds),
      ...(cancelSignal ? { cancelSignal } : {}),
    });
    const startedAt = new Date();
    const start = performance.now();
    const redirects: RedirectHop[] = [];
    const cookies: ResponseCookie[] = [];
    let current = request;

    try {
      for (;;) {
        const url = new URL(current.url);
        const refusal = refuseTarget(url);
        if (refusal) {
          return {
            outcome: "error",
            request,
            error: { code: "BLOCKED_ADDRESS", message: refusal },
          };
        }

        const requestBody = toRequestBody(current.body);
        const response = await sendRequest(url, {
          method: current.method,
          headers: toFlatHeaders(current.headers),
          ...(requestBody === undefined ? {} : { body: requestBody }),
          dispatcher,
          signal,
        });
        const headersReceived = performance.now();
        const headers = toHeaderPairs(response.headers);
        for (const header of headers.filter((candidate) => candidate.name === "set-cookie")) {
          const cookie = parseSetCookie(header.value, current.url, startedAt);
          if (cookie) cookies.push(cookie);
        }

        const location = headerValue(headers, "location");
        if (options.followRedirects && isRedirectStatus(response.statusCode) && location !== null) {
          await response.body.dump();
          if (redirects.length >= options.maxRedirects) {
            return {
              outcome: "error",
              request,
              error: {
                code: "TOO_MANY_REDIRECTS",
                message: `Stopped after ${String(options.maxRedirects)} redirects`,
              },
            };
          }
          const next = followRedirect(current, response.statusCode, location);
          if (next) {
            redirects.push({ status: response.statusCode, url: current.url, location });
            current = next;
            continue;
          }
        }

        const received = await readBody(response.body, config.maxResponseBytes);
        const finished = performance.now();
        const decoded = decodeBody(received.bytes, headerValue(headers, "content-encoding"));
        const statusText = STATUS_CODES[response.statusCode] ?? "";
        return {
          outcome: "response",
          request,
          response: {
            status: response.statusCode,
            statusText,
            url: current.url,
            headers,
            cookies,
            body: encodeResponseBody(
              decoded,
              headerValue(headers, "content-type"),
              received.truncated,
            ),
            sizes: {
              requestBytes: measureRequestBytes(current),
              responseHeadersBytes: measureResponseHeaders(
                response.statusCode,
                statusText,
                headers,
              ),
              responseBodyBytes: received.bytes.length,
              decodedBodyBytes: decoded.length,
            },
            timings: {
              startedAt: startedAt.toISOString(),
              timeToFirstByteMilliseconds: headersReceived - start,
              downloadMilliseconds: finished - headersReceived,
              totalMilliseconds: finished - start,
            },
            redirects,
            httpVersion: HTTP_VERSION,
          },
        };
      }
    } catch (error) {
      return { outcome: "error", request, error: toExecutionError(error, signal) };
    }
  };

  return { execute, close: () => dispatcher.close() };
}
