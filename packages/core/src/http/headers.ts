import type { HeaderPair } from "../execution/resolved-request.schema";

/** RFC 9110 §5.6.2: a header name is a non-empty token of visible ASCII, no separators. */
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** Tells whether text is a valid HTTP header name. */
export function isValidHeaderName(name: string): boolean {
  return HEADER_NAME_PATTERN.test(name);
}

/** Request headers offered by name autocomplete (F-05), in rough order of everyday use. */
export const COMMON_REQUEST_HEADERS = [
  "Accept",
  "Accept-Encoding",
  "Accept-Language",
  "Authorization",
  "Cache-Control",
  "Content-Type",
  "Cookie",
  "If-Match",
  "If-None-Match",
  "If-Modified-Since",
  "Origin",
  "Referer",
  "User-Agent",
  "X-Api-Key",
  "X-Request-Id",
  "X-Requested-With",
] as const;

/** Header names compare case-insensitively (RFC 9110 §5.1). */
function sameHeaderName(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

/** Tells whether a header with this name is present, ignoring case. */
export function hasHeader(headers: readonly HeaderPair[], name: string): boolean {
  return headers.some((header) => sameHeaderName(header.name, name));
}

/** The first value of a header, ignoring case in its name. */
export function getHeader(headers: readonly HeaderPair[], name: string): string | undefined {
  return headers.find((header) => sameHeaderName(header.name, name))?.value;
}

/**
 * Adds a header only when no header of that name exists yet. Generated headers (auth,
 * Content-Type) never replace a header the user wrote.
 */
export function addHeaderIfMissing(
  headers: readonly HeaderPair[],
  header: HeaderPair,
): HeaderPair[] {
  return hasHeader(headers, header.name) ? [...headers] : [...headers, header];
}
