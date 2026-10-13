import { joinUrl, splitUrl } from "./url-parts";
import type { KeyValueEntry } from "../models/key-value-entry.schema";
import { createKeyValueEntry } from "../models/model-factories";

/**
 * A path variable is a whole path segment written `:name` (F-04), as in `/users/:id/posts`. It
 * must follow a `/`, so ports (`localhost:8080`) and IPv6 hosts (`[::1]`) are never mistaken
 * for one.
 */
const PATH_VARIABLE_PATTERN = /\/:([A-Za-z_][A-Za-z0-9_]*)(?=\/|$)/g;

/** The distinct path variable names in a URL's path, in order. Query and fragment are ignored. */
export function findPathVariableNames(url: string): string[] {
  const { base } = splitUrl(url);
  return [...new Set([...base.matchAll(PATH_VARIABLE_PATTERN)].map((match) => match[1] ?? ""))];
}

/**
 * Updates the path variable table after the URL changed: one row per name, in path order. A row
 * whose name is still in the path keeps its value, id and note; rows for removed names go.
 */
export function syncPathVariablesFromUrl(
  url: string,
  entries: readonly KeyValueEntry[],
): KeyValueEntry[] {
  const existing = new Map(entries.map((entry) => [entry.key, entry]));
  return findPathVariableNames(url).map(
    (name) => existing.get(name) ?? createKeyValueEntry({ key: name }),
  );
}

/**
 * Replaces each `:name` segment with the value `lookup` returns; names it returns `undefined`
 * for stay as written. Values are inserted as given; encoding happens when the request is sent.
 */
export function replacePathVariables(
  url: string,
  lookup: (name: string) => string | undefined,
): string {
  const parts = splitUrl(url);
  const base = parts.base.replace(PATH_VARIABLE_PATTERN, (segment, name: string) => {
    const value = lookup(name);
    return value === undefined ? segment : `/${value}`;
  });
  return joinUrl({ ...parts, base });
}
