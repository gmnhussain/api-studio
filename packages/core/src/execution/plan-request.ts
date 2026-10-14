import type { ResponseCookie } from "./execution-result.schema";
import type { HeaderPair, ResolvedRequest } from "./resolved-request.schema";
import { applyAuth } from "../http/apply-auth";
import { cookiesForUrl, formatCookieHeader } from "../http/cookies";
import { addHeaderIfMissing, hasHeader, isValidHeaderName } from "../http/headers";
import { replacePathVariables } from "../http/path-variables";
import { defaultContentType, serializeBody } from "../http/serialize-body";
import type { AuthConfig } from "../models/auth.schema";
import type { KeyValueEntry } from "../models/key-value-entry.schema";
import type { RequestBody } from "../models/request-body.schema";
import type { HttpRequestDefinition } from "../models/request.schema";
import { assertNever } from "../result/assert-never";
import { err, ok, type Result } from "../result/result";
import { resolveVariables } from "../variables/resolve-variables";
import type { VariableMap } from "../variables/variable-scopes";

/** The scheme assumed for a URL written without one, as other API clients do. */
const DEFAULT_SCHEME = "http://";
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const SUPPORTED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

/** Why a request could not be built. */
export type PlanError =
  | { code: "UNRESOLVED_VARIABLES"; names: string[] }
  | {
      code: "INVALID_REQUEST";
      reason: "invalid_url" | "unsupported_scheme" | "invalid_header_name";
      detail: string;
    };

/** A request ready to send, and whether secret values went into it (for redaction). */
export type PlannedRequest = { request: ResolvedRequest; usesSecrets: boolean };

/** What planning needs besides the request itself. */
export type PlanInput = {
  request: HttpRequestDefinition;
  variables: VariableMap;
  /** The auth used when the request's auth is `inherit` (see `resolveInheritedAuth`). */
  inheritedAuth: AuthConfig;
  /** The workspace cookie jar; matching cookies are sent with the request. */
  cookieJar?: readonly ResponseCookie[];
  now?: Date;
};

/**
 * Builds exactly what is sent (request-execution.md#pipeline, steps 1–3): variables resolved,
 * path variables filled in, the URL normalized, auth applied, the body serialized, the default
 * `Content-Type` and the `Cookie` header added. Generated headers never replace one the user
 * wrote. Pure: the same input always gives the same request.
 */
export function planRequest({
  request,
  variables,
  inheritedAuth,
  cookieJar = [],
  now = new Date(),
}: PlanInput): Result<PlannedRequest, PlanError> {
  const unresolved = new Set<string>();
  let usesSecrets = false;
  const resolve = (text: string): string => {
    const resolution = resolveVariables(text, variables);
    for (const variable of resolution.unresolved) unresolved.add(variable.name);
    if (resolution.usesSecrets) usesSecrets = true;
    return resolution.value;
  };
  const resolveEntries = <Entry extends KeyValueEntry>(entries: readonly Entry[]): Entry[] =>
    entries
      .filter((entry) => entry.enabled && entry.key !== "")
      .map((entry) => ({ ...entry, key: resolve(entry.key), value: resolve(entry.value) }));

  const pathValues = new Map(
    request.pathVariables
      .filter((entry) => entry.value !== "")
      .map((entry) => [entry.key, resolve(entry.value)]),
  );
  const rawUrl = resolve(replacePathVariables(request.url, (name) => pathValues.get(name))).trim();
  const headers: HeaderPair[] = resolveEntries(request.headers).map((entry) => ({
    name: entry.key.trim(),
    value: entry.value,
  }));
  const cookies = resolveEntries(request.cookies).map((entry) => ({
    name: entry.key,
    value: entry.value,
  }));
  const auth = resolveAuth(request.auth.type === "inherit" ? inheritedAuth : request.auth, resolve);
  const body = resolveBody(request.body, resolve, resolveEntries);

  if (unresolved.size > 0) return err({ code: "UNRESOLVED_VARIABLES", names: [...unresolved] });

  const url = URL.parse(SCHEME_PATTERN.test(rawUrl) ? rawUrl : `${DEFAULT_SCHEME}${rawUrl}`);
  if (!url || url.hostname === "") {
    return err({ code: "INVALID_REQUEST", reason: "invalid_url", detail: rawUrl });
  }
  if (!SUPPORTED_PROTOCOLS.has(url.protocol)) {
    return err({ code: "INVALID_REQUEST", reason: "unsupported_scheme", detail: url.protocol });
  }
  const invalidHeader = headers.find((header) => !isValidHeaderName(header.name));
  if (invalidHeader) {
    return err({
      code: "INVALID_REQUEST",
      reason: "invalid_header_name",
      detail: invalidHeader.name,
    });
  }

  const withAuth = applyAuth({ url: url.toString(), headers }, auth);
  let finalHeaders = withAuth.headers;
  const contentType = defaultContentType(body);
  // Multipart bodies get their Content-Type, with its boundary, from the transport.
  if (contentType !== null && body.type !== "form_data") {
    finalHeaders = addHeaderIfMissing(finalHeaders, { name: "Content-Type", value: contentType });
  }
  if (!hasHeader(finalHeaders, "Cookie")) {
    const written = new Set(cookies.map((cookie) => cookie.name));
    const fromJar = cookiesForUrl(cookieJar, withAuth.url, now).filter(
      (cookie) => !written.has(cookie.name),
    );
    const all = [...cookies, ...fromJar];
    if (all.length > 0) {
      finalHeaders = [...finalHeaders, { name: "Cookie", value: formatCookieHeader(all) }];
    }
  }

  return ok({
    request: {
      method: request.method,
      url: withAuth.url,
      headers: finalHeaders,
      body: serializeBody(body),
    },
    usesSecrets,
  });
}

function resolveAuth(auth: AuthConfig, resolve: (text: string) => string): AuthConfig {
  switch (auth.type) {
    case "none":
    case "inherit":
      return auth;
    case "basic":
      return { ...auth, username: resolve(auth.username), password: resolve(auth.password) };
    case "bearer":
      return { ...auth, token: resolve(auth.token), prefix: resolve(auth.prefix) };
    case "api_key":
      return { ...auth, key: resolve(auth.key), value: resolve(auth.value) };
    case "oauth2":
      return { ...auth, accessToken: resolve(auth.accessToken) };
    default:
      return assertNever(auth, "auth type");
  }
}

function resolveBody(
  body: RequestBody,
  resolve: (text: string) => string,
  resolveEntries: <Entry extends KeyValueEntry>(entries: readonly Entry[]) => Entry[],
): RequestBody {
  switch (body.type) {
    case "none":
    case "binary":
      return body;
    case "json":
    case "text":
    case "xml":
      return { ...body, text: resolve(body.text) };
    case "form_data":
      return { ...body, entries: resolveEntries(body.entries) };
    case "url_encoded":
      return { ...body, entries: resolveEntries(body.entries) };
    default:
      return assertNever(body, "body type");
  }
}
