import { joinUrl, splitUrl } from "./url-parts";
import type { KeyValueEntry } from "../models/key-value-entry.schema";
import { createKeyValueEntry } from "../models/model-factories";

/** One `key=value` pair of a query string, exactly as written. */
export type QueryPair = { key: string; value: string };

/**
 * Parses a query string into pairs without decoding, so the table shows what the URL bar shows
 * and editing either one round-trips. `a&b=` gives `a` and `b` with empty values; empty segments
 * (`a=1&&b=2`) are skipped.
 */
export function parseQueryString(query: string): QueryPair[] {
  return query
    .split("&")
    .filter((segment) => segment !== "")
    .map((segment) => {
      const equalsIndex = segment.indexOf("=");
      return equalsIndex === -1
        ? { key: segment, value: "" }
        : { key: segment.slice(0, equalsIndex), value: segment.slice(equalsIndex + 1) };
    });
}

/** Writes pairs as a query string; a pair with an empty value is written as just its key. */
export function formatQueryString(pairs: readonly QueryPair[]): string {
  return pairs.map(({ key, value }) => (value === "" ? key : `${key}=${value}`)).join("&");
}

/**
 * Updates the query parameter table after the URL changed. Enabled rows take the URL's pairs in
 * order, keeping their ids and descriptions, so a row does not jump or lose its note while the
 * user types. Disabled rows stay where they are, because they are not part of the URL. Extra
 * pairs become new rows; enabled rows without a pair are removed.
 */
export function syncQueryParametersFromUrl(
  url: string,
  entries: readonly KeyValueEntry[],
): KeyValueEntry[] {
  const { query } = splitUrl(url);
  const pairs = query === null ? [] : parseQueryString(query);
  let pairIndex = 0;
  const synced: KeyValueEntry[] = [];

  for (const entry of entries) {
    if (!entry.enabled) {
      synced.push(entry);
      continue;
    }
    const pair = pairs[pairIndex];
    if (!pair) continue;
    pairIndex += 1;
    synced.push(
      entry.key === pair.key && entry.value === pair.value ? entry : { ...entry, ...pair },
    );
  }
  for (const pair of pairs.slice(pairIndex)) synced.push(createKeyValueEntry(pair));
  return synced;
}

/**
 * Rewrites the URL's query string from the table after a row changed: enabled rows with a key,
 * in table order. The rest of the URL, fragment included, is kept as typed.
 */
export function buildUrlFromQueryParameters(
  url: string,
  entries: readonly KeyValueEntry[],
): string {
  const parts = splitUrl(url);
  const pairs = entries.filter((entry) => entry.enabled && entry.key !== "");
  const query = pairs.length === 0 ? null : formatQueryString(pairs);
  return joinUrl({ ...parts, query });
}
