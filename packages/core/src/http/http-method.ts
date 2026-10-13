/**
 * HTTP methods API Studio can send, in the order the method picker shows them.
 */
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;

/** An HTTP method supported by the request builder (F-01). */
export type HttpMethod = (typeof HTTP_METHODS)[number];

const httpMethodSet: ReadonlySet<string> = new Set(HTTP_METHODS);

/**
 * Tells whether a value is a supported HTTP method. Matching is case-sensitive,
 * because HTTP method names are case-sensitive (RFC 9110 §9.1).
 *
 * @param value Any value, typically parsed from an import or persisted record.
 * @returns `true` when `value` is one of {@link HTTP_METHODS}.
 */
export function isHttpMethod(value: unknown): value is HttpMethod {
  return typeof value === "string" && httpMethodSet.has(value);
}

/**
 * Tells whether a request with this method conventionally carries a body.
 * The request builder still allows a body on any method; this only drives defaults.
 *
 * @param method The request method.
 * @returns `false` for `GET`, `HEAD` and `OPTIONS`, `true` otherwise.
 */
export function isBodyConventional(method: HttpMethod): boolean {
  switch (method) {
    case "GET":
    case "HEAD":
    case "OPTIONS":
      return false;
    case "POST":
    case "PUT":
    case "PATCH":
    case "DELETE":
      return true;
  }
}
