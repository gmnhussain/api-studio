import { addHeaderIfMissing } from "./headers";
import { joinUrl, splitUrl } from "./url-parts";
import type { HeaderPair } from "../execution/resolved-request.schema";
import type { AuthConfig } from "../models/auth.schema";
import { assertNever } from "../result/assert-never";

/** The parts of a request that auth can change. */
export type AuthTarget = { url: string; headers: HeaderPair[] };

const AUTHORIZATION_HEADER = "Authorization";

/** Base64 of the UTF-8 bytes, so non-ASCII credentials encode correctly (RFC 7617 §2.1). */
function encodeBase64Utf8(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * The auth that applies to an item: its own unless it is `inherit`, then the nearest ancestor's,
 * from the item's folder up to the collection. Inheriting all the way up means no auth.
 *
 * @param chain The item's auth first, then each parent folder's, then the collection's.
 */
export function resolveInheritedAuth(chain: readonly AuthConfig[]): AuthConfig {
  return chain.find((auth) => auth.type !== "inherit") ?? { type: "none" };
}

/**
 * Applies auth (variables already resolved) to a request. Generated headers never replace a
 * header the user wrote, so an explicit `Authorization` header always wins. Empty credentials add
 * nothing. An API key in the query is appended encoded, since the user did not type it there.
 */
export function applyAuth(target: AuthTarget, auth: AuthConfig): AuthTarget {
  switch (auth.type) {
    case "none":
    case "inherit":
      return target;
    case "basic":
      if (auth.username === "" && auth.password === "") return target;
      return withHeader(target, `Basic ${encodeBase64Utf8(`${auth.username}:${auth.password}`)}`);
    case "bearer":
      if (auth.token === "") return target;
      return withHeader(target, [auth.prefix.trim(), auth.token].filter(Boolean).join(" "));
    case "oauth2":
      if (auth.accessToken === "") return target;
      return withHeader(target, `Bearer ${auth.accessToken}`);
    case "api_key":
      if (auth.key === "") return target;
      return auth.placement === "header"
        ? {
            ...target,
            headers: addHeaderIfMissing(target.headers, { name: auth.key, value: auth.value }),
          }
        : { ...target, url: appendQueryParameter(target.url, auth.key, auth.value) };
    default:
      return assertNever(auth, "auth type");
  }
}

function withHeader(target: AuthTarget, value: string): AuthTarget {
  return {
    ...target,
    headers: addHeaderIfMissing(target.headers, { name: AUTHORIZATION_HEADER, value }),
  };
}

function appendQueryParameter(url: string, key: string, value: string): string {
  const parts = splitUrl(url);
  const pair = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  const query = parts.query === null || parts.query === "" ? pair : `${parts.query}&${pair}`;
  return joinUrl({ ...parts, query });
}
