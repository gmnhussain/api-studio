import { describe, expect, it } from "vitest";

import {
  describeJsonValue,
  formatJsonPath,
  formatJsonValueForCopy,
  getJsonValueAt,
  JSON_PREVIEW_MAX_LENGTH,
  JSON_TREE_MAX_CHILDREN,
  listJsonChildren,
} from "./json-tree";

const document = {
  users: [{ id: 1, name: "Ada", active: true, manager: null }],
  "first name": "Grace",
};

describe("describeJsonValue", () => {
  it("describes primitives with a preview and containers with a child count", () => {
    expect(describeJsonValue("Ada", ["name"])).toEqual({
      type: "value",
      path: ["name"],
      kind: "string",
      preview: "Ada",
      childCount: 0,
    });
    expect(describeJsonValue(1.5, [])).toMatchObject({ kind: "number", preview: "1.5" });
    expect(describeJsonValue(false, [])).toMatchObject({ kind: "boolean", preview: "false" });
    expect(describeJsonValue(null, [])).toMatchObject({ kind: "null", preview: "null" });
    expect(describeJsonValue({ a: 1, b: 2 }, [])).toMatchObject({
      kind: "object",
      preview: "",
      childCount: 2,
    });
    expect(describeJsonValue([1, 2, 3], [])).toMatchObject({ kind: "array", childCount: 3 });
  });

  it("cuts long strings in the preview", () => {
    const entry = describeJsonValue("x".repeat(JSON_PREVIEW_MAX_LENGTH * 2), []);
    expect(entry.type === "value" && entry.preview.length).toBe(JSON_PREVIEW_MAX_LENGTH);
  });
});

describe("getJsonValueAt", () => {
  it("follows keys and indexes", () => {
    expect(getJsonValueAt(document, ["users", 0, "name"])).toBe("Ada");
    expect(getJsonValueAt(document, [])).toBe(document);
  });

  it("is undefined for paths that lead nowhere, without reaching the prototype", () => {
    expect(getJsonValueAt(document, ["users", 5])).toBeUndefined();
    expect(getJsonValueAt(document, ["users", "0"])).toBeUndefined();
    expect(getJsonValueAt(document, ["constructor"])).toBeUndefined();
    expect(getJsonValueAt(document, ["first name", "x"])).toBeUndefined();
  });
});

describe("listJsonChildren", () => {
  it("lists the keys of an object and the items of an array", () => {
    expect(listJsonChildren(document, []).map((entry) => entry.path)).toEqual([
      ["users"],
      ["first name"],
    ]);
    expect(listJsonChildren(document, ["users", 0])).toHaveLength(4);
  });

  it("lists nothing under primitives or missing paths", () => {
    expect(listJsonChildren(document, ["first name"])).toEqual([]);
    expect(listJsonChildren(document, ["missing"])).toEqual([]);
  });

  it("groups large containers into ranges, and nests them for huge ones", () => {
    const items = Array.from({ length: 1_000_000 }, (_value, index) => index);
    const ranges = listJsonChildren(items, []);
    expect(ranges).toHaveLength(100);
    expect(ranges[0]).toEqual({ type: "range", path: [], start: 0, end: 10_000 });

    const inner = listJsonChildren(items, [], { start: 10_000, end: 20_000 });
    expect(inner).toHaveLength(100);
    expect(inner[1]).toEqual({ type: "range", path: [], start: 10_100, end: 10_200 });

    const leaves = listJsonChildren(items, [], { start: 10_100, end: 10_200 });
    expect(leaves.map((entry) => entry.path)).toContainEqual([10_150]);
  });

  it("keeps a container just at the limit flat, and shortens the last range", () => {
    const atLimit = Array.from({ length: JSON_TREE_MAX_CHILDREN }, () => 0);
    expect(listJsonChildren(atLimit, []).every((entry) => entry.type === "value")).toBe(true);

    const overLimit = Array.from({ length: JSON_TREE_MAX_CHILDREN + 50 }, () => 0);
    expect(listJsonChildren(overLimit, []).at(-1)).toEqual({
      type: "range",
      path: [],
      start: 500,
      end: 550,
    });
  });

  it("groups object keys in insertion order", () => {
    const record = Object.fromEntries(
      Array.from({ length: 600 }, (_value, index) => [`key${String(index)}`, index]),
    );
    const leaves = listJsonChildren(record, [], { start: 100, end: 102 });
    expect(leaves.map((entry) => entry.path)).toEqual([["key100"], ["key101"]]);
  });
});

describe("formatJsonPath", () => {
  it("writes JSONPath with dots for identifiers and brackets otherwise", () => {
    expect(formatJsonPath([])).toBe("$");
    expect(formatJsonPath(["users", 0, "name"])).toBe("$.users[0].name");
    expect(formatJsonPath(["first name", "$ref", "a-b", "9"])).toBe(
      '$["first name"].$ref["a-b"]["9"]',
    );
    expect(formatJsonPath(['say "hi"'])).toBe(String.raw`$["say \"hi\""]`);
  });
});

describe("formatJsonValueForCopy", () => {
  it("copies strings without quotes and everything else as JSON", () => {
    expect(formatJsonValueForCopy("Ada")).toBe("Ada");
    expect(formatJsonValueForCopy(42)).toBe("42");
    expect(formatJsonValueForCopy(null)).toBe("null");
    expect(formatJsonValueForCopy({ a: [1] })).toBe('{\n  "a": [\n    1\n  ]\n}');
    expect(formatJsonValueForCopy(undefined)).toBe("");
  });
});
