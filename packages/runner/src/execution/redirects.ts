import type { HeaderPair, ResolvedRequest } from "@api-studio/core";

/** Statuses that redirect when they carry a `Location` (RFC 9110 §15.4). */
const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

/** Headers that describe the body; they go when a redirect drops the body. */
const BODY_HEADERS: ReadonlySet<string> = new Set([
  "content-type",
  "content-length",
  "content-encoding",
  "content-language",
  "content-location",
]);

/** Credentials that must not follow a redirect to another origin, as browsers and curl do. */
const CREDENTIAL_HEADERS: ReadonlySet<string> = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
]);

/** Whether a status redirects. */
export function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

/**
 * The request to send after a redirect, or `null` when `location` is not a usable URL.
 *
 * - 303 turns any method but `HEAD` into `GET`; 301 and 302 turn `POST` into `GET`, as every
 *   client does (RFC 9110 §15.4.2–4). The body and its headers go with the change.
 * - 307 and 308 repeat the request as it was.
 * - Credentials stay behind when the redirect leaves the origin.
 */
export function followRedirect(
  request: ResolvedRequest,
  status: number,
  location: string,
): ResolvedRequest | null {
  const target = URL.parse(location, request.url);
  if (!target || (target.protocol !== "http:" && target.protocol !== "https:")) return null;

  const becomesGet =
    (status === 303 && request.method !== "HEAD") ||
    ((status === 301 || status === 302) && request.method === "POST");
  const sameOrigin = new URL(request.url).origin === target.origin;
  const keep = (header: HeaderPair) => {
    const name = header.name.toLowerCase();
    if (becomesGet && BODY_HEADERS.has(name)) return false;
    return sameOrigin || !CREDENTIAL_HEADERS.has(name);
  };

  return {
    method: becomesGet ? "GET" : request.method,
    url: target.toString(),
    headers: request.headers.filter(keep),
    body: becomesGet ? { kind: "none" } : request.body,
  };
}
