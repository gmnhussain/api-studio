/**
 * Extracts the `state` that Zustand `persist` wrote into a cookie (`{ state, version }`).
 * Anything malformed yields `undefined`, so callers fall back to their defaults.
 *
 * @param raw The decoded cookie value, from the browser or from `cookies()` on the server.
 */
export function readPersistedState(raw: string | null | undefined): unknown {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && "state" in parsed
      ? parsed.state
      : undefined;
  } catch {
    return undefined;
  }
}
