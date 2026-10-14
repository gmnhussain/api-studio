import { COOKIE_SAME_SITE_VALUES, type ResponseCookie } from "../execution/execution-result.schema";

/** Milliseconds per second, for `Max-Age`. */
const MILLISECONDS_PER_SECOND = 1000;

/** The default path of a cookie set without `Path` (RFC 6265 §5.1.4). */
function defaultPath(url: URL): string {
  const path = url.pathname;
  if (!path.startsWith("/")) return "/";
  const lastSlash = path.lastIndexOf("/");
  return lastSlash <= 0 ? "/" : path.slice(0, lastSlash);
}

/** Whether a host is the cookie domain or one of its subdomains (RFC 6265 §5.1.3). */
function domainMatches(host: string, domain: string): boolean {
  return host === domain || (host.endsWith(`.${domain}`) && !/^\d+(\.\d+){3}$/.test(host));
}

/** Whether a request path is within a cookie path (RFC 6265 §5.1.4). */
function pathMatches(requestPath: string, cookiePath: string): boolean {
  if (requestPath === cookiePath) return true;
  if (!requestPath.startsWith(cookiePath)) return false;
  return cookiePath.endsWith("/") || requestPath.charAt(cookiePath.length) === "/";
}

function parseSameSite(value: string): ResponseCookie["sameSite"] {
  const lowered = value.toLowerCase();
  return COOKIE_SAME_SITE_VALUES.find((sameSite) => sameSite === lowered) ?? null;
}

/**
 * Parses one `Set-Cookie` header from a response to `requestUrl` (RFC 6265 §5.2). `Max-Age`
 * wins over `Expires`; a `Domain` the request host does not belong to makes the cookie invalid.
 * Returns `null` for headers that do not set a usable cookie.
 */
export function parseSetCookie(
  header: string,
  requestUrl: string,
  now: Date,
): ResponseCookie | null {
  const url = URL.parse(requestUrl);
  if (!url) return null;
  const [pair = "", ...attributes] = header.split(";");
  const equalsIndex = pair.indexOf("=");
  if (equalsIndex <= 0) return null;
  const host = url.hostname.toLowerCase();

  const cookie: ResponseCookie = {
    name: pair.slice(0, equalsIndex).trim(),
    value: pair.slice(equalsIndex + 1).trim(),
    domain: host,
    hostOnly: true,
    path: defaultPath(url),
    expiresAt: null,
    secure: false,
    httpOnly: false,
    sameSite: null,
  };
  let maxAgeExpiry: string | null = null;

  for (const attribute of attributes) {
    const separator = attribute.indexOf("=");
    const name = (separator === -1 ? attribute : attribute.slice(0, separator))
      .trim()
      .toLowerCase();
    const value = separator === -1 ? "" : attribute.slice(separator + 1).trim();
    switch (name) {
      case "domain": {
        const domain = value.replace(/^\./, "").toLowerCase();
        if (domain === "") break;
        if (!domainMatches(host, domain)) return null;
        cookie.domain = domain;
        cookie.hostOnly = false;
        break;
      }
      case "path":
        cookie.path = value.startsWith("/") ? value : defaultPath(url);
        break;
      case "expires": {
        const time = Date.parse(value);
        if (!Number.isNaN(time)) cookie.expiresAt = new Date(time).toISOString();
        break;
      }
      case "max-age": {
        const seconds = Number(value);
        if (Number.isInteger(seconds)) {
          maxAgeExpiry = new Date(
            seconds <= 0 ? 0 : now.getTime() + seconds * MILLISECONDS_PER_SECOND,
          ).toISOString();
        }
        break;
      }
      case "secure":
        cookie.secure = true;
        break;
      case "httponly":
        cookie.httpOnly = true;
        break;
      case "samesite":
        cookie.sameSite = parseSameSite(value);
        break;
      default:
        break;
    }
  }
  if (maxAgeExpiry !== null) cookie.expiresAt = maxAgeExpiry;
  return cookie;
}

/** Whether a cookie has expired by `now`; session cookies never expire here. */
export function isCookieExpired(cookie: ResponseCookie, now: Date): boolean {
  return cookie.expiresAt !== null && Date.parse(cookie.expiresAt) <= now.getTime();
}

/** Whether a stored cookie is sent with a request to `requestUrl` (RFC 6265 §5.4). */
export function cookieMatchesUrl(cookie: ResponseCookie, requestUrl: string, now: Date): boolean {
  const url = URL.parse(requestUrl);
  if (!url || isCookieExpired(cookie, now)) return false;
  const host = url.hostname.toLowerCase();
  const domainOk = cookie.hostOnly ? host === cookie.domain : domainMatches(host, cookie.domain);
  return (
    domainOk &&
    pathMatches(url.pathname, cookie.path) &&
    (!cookie.secure || url.protocol === "https:")
  );
}

/** The cookies of a jar to send to `requestUrl`, longest path first (RFC 6265 §5.4). */
export function cookiesForUrl(
  jar: readonly ResponseCookie[],
  requestUrl: string,
  now: Date,
): ResponseCookie[] {
  return jar
    .filter((cookie) => cookieMatchesUrl(cookie, requestUrl, now))
    .sort((left, right) => right.path.length - left.path.length);
}

/**
 * The jar after a response set cookies: a cookie replaces the one with the same name, domain and
 * path, and expired cookies (including ones a response deleted with `Max-Age=0`) are dropped.
 */
export function updateCookieJar(
  jar: readonly ResponseCookie[],
  received: readonly ResponseCookie[],
  now: Date,
): ResponseCookie[] {
  const key = (cookie: ResponseCookie) =>
    `${cookie.name}\u0000${cookie.domain}\u0000${cookie.path}`;
  const byKey = new Map(jar.map((cookie) => [key(cookie), cookie]));
  for (const cookie of received) byKey.set(key(cookie), cookie);
  return [...byKey.values()].filter((cookie) => !isCookieExpired(cookie, now));
}

/** A `Cookie` header value from name-value pairs. */
export function formatCookieHeader(pairs: readonly { name: string; value: string }[]): string {
  return pairs.map(({ name, value }) => `${name}=${value}`).join("; ");
}
