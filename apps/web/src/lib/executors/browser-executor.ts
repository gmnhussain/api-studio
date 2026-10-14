import {
  encodeResponseBody,
  measureRequestBytes,
  type ExecutionResult,
  type HeaderPair,
  type RequestExecutor,
  type SerializedBody,
} from "@api-studio/core";

/** The most of a response body the browser keeps; the rest is cut and marked truncated. */
export const BROWSER_MAX_RESPONSE_BYTES = 50 * 1024 * 1024;

function toFetchBody(body: SerializedBody): BodyInit | undefined {
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

/** Reads a body up to the cap, stopping the download past it. */
async function readCapped(response: Response): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!response.body) return { bytes: new Uint8Array(), truncated: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = BROWSER_MAX_RESPONSE_BYTES - total;
    if (value.length > room) {
      chunks.push(value.subarray(0, room));
      total += room;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    total += value.length;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { bytes, truncated };
}

/**
 * Sends requests straight from the browser: for a hosted demo reaching `localhost`, or APIs that
 * allow CORS. The browser drops forbidden headers, follows redirects out of sight, hides
 * `Set-Cookie` and blocks responses without CORS headers, which surface as network errors
 * (request-execution.md#executor-contract).
 */
export function createBrowserExecutor(
  fetchImplementation: typeof fetch = (input, init) => fetch(input, init),
): RequestExecutor {
  return {
    id: "browser",
    capabilities: {
      canSetForbiddenHeaders: false,
      canReadRedirectChain: false,
      bypassesCors: false,
      measuresTimings: true,
    },
    execute: async (request, { signal, ...options }): Promise<ExecutionResult> => {
      const timeout = AbortSignal.timeout(options.timeoutMilliseconds);
      const startedAt = new Date();
      const start = performance.now();
      try {
        const body = toFetchBody(request.body);
        const response = await fetchImplementation(request.url, {
          method: request.method,
          headers: request.headers.map((header): [string, string] => [header.name, header.value]),
          ...(body === undefined ? {} : { body }),
          redirect: options.followRedirects ? "follow" : "manual",
          signal: AbortSignal.any([signal, timeout]),
        });
        const headersReceived = performance.now();
        const { bytes, truncated } = await readCapped(response);
        const finished = performance.now();
        const headers: HeaderPair[] = [...response.headers].map(([name, value]) => ({
          name,
          value,
        }));
        const contentType = response.headers.get("content-type");
        return {
          outcome: "response",
          request,
          response: {
            status: response.status,
            statusText: response.statusText,
            url: response.url || request.url,
            headers,
            cookies: [],
            body: encodeResponseBody(bytes, contentType, truncated),
            sizes: {
              requestBytes: measureRequestBytes(request),
              responseHeadersBytes: 0,
              responseBodyBytes: bytes.length,
              decodedBodyBytes: bytes.length,
            },
            timings: {
              startedAt: startedAt.toISOString(),
              timeToFirstByteMilliseconds: headersReceived - start,
              downloadMilliseconds: finished - headersReceived,
              totalMilliseconds: finished - start,
            },
            redirects: [],
            httpVersion: "",
          },
        };
      } catch (error) {
        if (signal.aborted) {
          return { outcome: "error", request, error: { code: "ABORTED", message: "Cancelled" } };
        }
        if (timeout.aborted) {
          return {
            outcome: "error",
            request,
            error: { code: "TIMEOUT", message: "The request took longer than its timeout" },
          };
        }
        return {
          outcome: "error",
          request,
          error: {
            code: "NETWORK",
            message: `${error instanceof Error ? error.message : String(error)} (the browser hides whether CORS or the network failed)`,
          },
        };
      }
    },
  };
}
