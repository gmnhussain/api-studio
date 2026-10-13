import { describe, expect, it } from "vitest";

import { isDeepEqual } from "./deep-equal";

describe("isDeepEqual", () => {
  it("compares primitives by value", () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual("a", "b")).toBe(false);
    expect(isDeepEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isDeepEqual(null, null)).toBe(true);
    expect(isDeepEqual(null, {})).toBe(false);
    expect(isDeepEqual(0, "0")).toBe(false);
  });

  it("compares objects by their properties, in any key order", () => {
    expect(isDeepEqual({ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isDeepEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it("compares arrays element by element, in order", () => {
    expect(isDeepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(isDeepEqual([1, 2], [2, 1])).toBe(false);
    expect(isDeepEqual([1], [1, 2])).toBe(false);
    expect(isDeepEqual([1], { 0: 1 })).toBe(false);
    expect(isDeepEqual({ 0: 1 }, [1])).toBe(false);
  });
});
