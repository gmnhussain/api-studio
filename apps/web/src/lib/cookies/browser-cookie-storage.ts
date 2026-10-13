import type { StateStorage } from "zustand/middleware";

/** How long preference cookies live: one year, refreshed on every write. */
export const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** A synchronous key-value store, the shape of `localStorage` that services depend on. */
export type KeyValueStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/**
 * Reads a cookie in the browser.
 *
 * @returns The decoded value, or `null` when the cookie is not set.
 */
export function readBrowserCookie(name: string): string | null {
  const prefix = `${name}=`;
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

/**
 * First-party cookies as a {@link KeyValueStorage}, for small values the server must read
 * (ADR-0011). Browser-only.
 */
export const browserCookieKeyValueStorage: KeyValueStorage = {
  getItem: readBrowserCookie,
  setItem: (name, value) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${String(PREFERENCE_COOKIE_MAX_AGE_SECONDS)}; samesite=lax`;
  },
  removeItem: (name) => {
    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
  },
};

/**
 * Zustand `persist` storage backed by first-party cookies, so the server and the pre-paint boot
 * script can read what the client saved (ADR-0011). Browser-only; stores using it skip hydration
 * on the server and rehydrate after mount.
 */
export const browserCookieStorage: StateStorage = browserCookieKeyValueStorage;
