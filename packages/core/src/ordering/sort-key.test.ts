import { describe, expect, it } from "vitest";

import {
  compareSortKeys,
  sortBySortKey,
  sortKeyBetween,
  sortKeysBetween,
  type SortKey,
} from "./sort-key";

describe("sort keys", () => {
  it("creates keys at the start, the end and between neighbours", () => {
    const first = sortKeyBetween(null, null);
    const last = sortKeyBetween(first, null);
    const middle = sortKeyBetween(first, last);
    const beforeFirst = sortKeyBetween(null, first);

    expect([beforeFirst, first, middle, last].sort(compareSortKeys)).toEqual([
      beforeFirst,
      first,
      middle,
      last,
    ]);
  });

  it("keeps inserting between the same neighbours without collisions", () => {
    let low = sortKeyBetween(null, null);
    const high = sortKeyBetween(low, null);
    for (let step = 0; step < 50; step += 1) {
      const next = sortKeyBetween(low, high);
      expect(compareSortKeys(low, next)).toBe(-1);
      expect(compareSortKeys(next, high)).toBe(-1);
      low = next;
    }
  });

  it("spreads several keys in order", () => {
    const keys = sortKeysBetween(null, null, 5);

    expect(new Set(keys).size).toBe(5);
    expect([...keys].sort(compareSortKeys)).toEqual(keys);
  });

  it("rejects neighbours in the wrong order", () => {
    const first = sortKeyBetween(null, null);
    const second = sortKeyBetween(first, null);

    expect(() => sortKeyBetween(second, first)).toThrow(RangeError);
    expect(() => sortKeyBetween(first, first)).toThrow(RangeError);
    expect(() => sortKeysBetween(second, first, 2)).toThrow(RangeError);
  });

  it("compares by code unit, not by locale", () => {
    const uppercase = "aZ" as SortKey;
    const lowercase = "aa" as SortKey;

    expect(compareSortKeys(uppercase, lowercase)).toBe(-1);
    expect(compareSortKeys(lowercase, lowercase)).toBe(0);
  });

  it("sorts items by key without mutating the input", () => {
    const [first, second, third] = sortKeysBetween(null, null, 3);
    const items = [
      { name: "c", sortKey: third ?? sortKeyBetween(null, null) },
      { name: "a", sortKey: first ?? sortKeyBetween(null, null) },
      { name: "b", sortKey: second ?? sortKeyBetween(null, null) },
    ];

    expect(sortBySortKey(items).map((item) => item.name)).toEqual(["a", "b", "c"]);
    expect(items.map((item) => item.name)).toEqual(["c", "a", "b"]);
  });
});
