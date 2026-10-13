import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

import type { Brand } from "../ids/ids";

/**
 * A fractional-index position among siblings (data-model.md#conventions). Moving an item writes
 * one new key between its new neighbours instead of renumbering the whole list.
 */
export type SortKey = Brand<string, "SortKey">;

function asSortKey(value: string): SortKey {
  // fractional-indexing returns valid keys; this is where they gain the brand.
  return value as SortKey;
}

/**
 * Orders sort keys. Keys compare by code unit, never by locale, because their digits are ASCII
 * with uppercase before lowercase.
 */
export function compareSortKeys(left: SortKey, right: SortKey): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** Neighbours in the wrong order would silently produce a key outside the gap. */
function assertNeighboursInOrder(before: SortKey | null, after: SortKey | null): void {
  if (before !== null && after !== null && compareSortKeys(before, after) >= 0) {
    throw new RangeError(`Sort key "${before}" must sort before "${after}"`);
  }
}

/**
 * A key that sorts after `before` and before `after`; `null` means the start or the end.
 *
 * @throws {RangeError} When `before` is not strictly smaller than `after`.
 */
export function sortKeyBetween(before: SortKey | null, after: SortKey | null): SortKey {
  assertNeighboursInOrder(before, after);
  return asSortKey(generateKeyBetween(before, after));
}

/**
 * `count` evenly spread keys between two neighbours, in order (for inserting several items).
 *
 * @throws {RangeError} When `before` is not strictly smaller than `after`.
 */
export function sortKeysBetween(
  before: SortKey | null,
  after: SortKey | null,
  count: number,
): SortKey[] {
  assertNeighboursInOrder(before, after);
  return generateNKeysBetween(before, after, count).map(asSortKey);
}

/** Sorts items by their `sortKey`, returning a new array. */
export function sortBySortKey<Item extends { readonly sortKey: SortKey }>(
  items: readonly Item[],
): Item[] {
  return [...items].sort((left, right) => compareSortKeys(left.sortKey, right.sortKey));
}
