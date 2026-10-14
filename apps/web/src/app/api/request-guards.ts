import "server-only";

import {
  HTTP_FORBIDDEN,
  HTTP_PAYLOAD_TOO_LARGE,
  HTTP_UNSUPPORTED_MEDIA_TYPE,
  problemResponse,
} from "./problem-details";

/** `Sec-Fetch-Site` values of requests the app itself makes (or a person types). */
const TRUSTED_FETCH_SITES: ReadonlySet<string> = new Set(["same-origin", "none"]);

/**
 * Refuses calls that did not come from the app's own pages. The proxy acts on the user's network
 * (often `localhost` services), so another website must not be able to drive it from the user's
 * browser. Requiring JSON forces a CORS preflight, which this API never grants, and the origin
 * checks refuse cross-site requests outright (request-execution.md#security).
 *
 * @returns A problem response to send, or `null` when the call may proceed.
 */
export function refuseUntrustedCaller(request: Request): Response | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && !TRUSTED_FETCH_SITES.has(fetchSite)) {
    return problemResponse({ status: HTTP_FORBIDDEN, title: "Cross-site calls are not allowed" });
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin !== null && host !== null && URL.parse(origin)?.host !== host) {
    return problemResponse({ status: HTTP_FORBIDDEN, title: "Cross-site calls are not allowed" });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(contentType)) {
    return problemResponse({
      status: HTTP_UNSUPPORTED_MEDIA_TYPE,
      title: "The body must be application/json",
    });
  }
  return null;
}

/** The body is larger than the endpoint accepts. */
export class BodyTooLargeError extends Error {
  constructor() {
    super("The request body is too large");
    this.name = "BodyTooLargeError";
  }
}

/**
 * Reads a request body as text, refusing to buffer more than `maxBytes`, so an oversized or
 * endless body cannot exhaust the server's memory before it is validated.
 *
 * @throws {BodyTooLargeError} Past the limit.
 */
export async function readBodyText(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return "";
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new BodyTooLargeError();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** The problem response for a body over the limit. */
export function bodyTooLargeResponse(): Response {
  return problemResponse({
    status: HTTP_PAYLOAD_TOO_LARGE,
    title: "The request body is too large",
  });
}
