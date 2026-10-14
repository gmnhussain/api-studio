import { PRETTY_PRINT_INDENT } from "./pretty-print";

/** One step into a JSON value: an object key or an array index. */
export type JsonPathSegment = string | number;

/** Where a value sits in a document, from the root; the root itself is `[]`. */
export type JsonPath = readonly JsonPathSegment[];

/** The kinds of JSON value (RFC 8259 §3). */
export type JsonValueKind = "object" | "array" | "string" | "number" | "boolean" | "null";

/** A row of the JSON tree: a value, or a range that groups many children of one container. */
export type JsonTreeEntry =
  | {
      type: "value";
      path: JsonPath;
      kind: JsonValueKind;
      /** Primitives as text (strings cut at {@link JSON_PREVIEW_MAX_LENGTH}); `""` for containers. */
      preview: string;
      /** Keys or items of a container; `0` for primitives. */
      childCount: number;
    }
  | {
      type: "range";
      /** The container whose children the range groups. */
      path: JsonPath;
      /** First child index in the range. */
      start: number;
      /** Index after the last child in the range. */
      end: number;
    };

/** A range of children of one container, by position: `[start, end)`. */
export type JsonChildRange = { start: number; end: number };

/** More children than this in one place are grouped into ranges, as browser devtools do. */
export const JSON_TREE_MAX_CHILDREN = 500;

/** Ranges hold a power of this many children: 100, 10,000, … */
export const JSON_TREE_GROUP_BASE = 100;

/** Characters of a string shown in its row; the full value is one "copy value" away. */
export const JSON_PREVIEW_MAX_LENGTH = 200;

/** Object keys, computed once per object: a large object is listed many times while scrolling. */
const keyCache = new WeakMap<object, readonly string[]>();

function keysOf(value: Record<string, unknown>): readonly string[] {
  let keys = keyCache.get(value);
  if (!keys) {
    keys = Object.keys(value);
    keyCache.set(value, keys);
  }
  return keys;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The kind of a parsed JSON value. */
export function getJsonValueKind(value: unknown): JsonValueKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "object";
}

/** How many children a container has; `0` for primitives. */
function childCountOf(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (isRecord(value)) return keysOf(value).length;
  return 0;
}

function previewOf(value: unknown): string {
  if (typeof value === "string") return value.slice(0, JSON_PREVIEW_MAX_LENGTH);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  return "";
}

/** The tree row of the value at a path. */
export function describeJsonValue(value: unknown, path: JsonPath): JsonTreeEntry {
  return {
    type: "value",
    path,
    kind: getJsonValueKind(value),
    preview: previewOf(value),
    childCount: childCountOf(value),
  };
}

/**
 * The value at a path, or `undefined` when the path leads nowhere. Only own keys count, so a key
 * such as `constructor` never reaches the prototype.
 */
export function getJsonValueAt(root: unknown, path: JsonPath): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === "number") {
      current = current[segment];
    } else if (
      isRecord(current) &&
      typeof segment === "string" &&
      Object.hasOwn(current, segment)
    ) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

/** How many children each range holds when `count` children are grouped. */
function groupSizeFor(count: number): number {
  let size = JSON_TREE_GROUP_BASE;
  while (Math.ceil(count / size) > JSON_TREE_MAX_CHILDREN) size *= JSON_TREE_GROUP_BASE;
  return size;
}

/**
 * The rows under a container, or under one of its ranges: its children when there are at most
 * {@link JSON_TREE_MAX_CHILDREN}, ranges of them otherwise. Rows are made only for what is
 * listed, so expanding one level of a huge document stays cheap.
 */
export function listJsonChildren(
  root: unknown,
  path: JsonPath,
  range?: JsonChildRange,
): JsonTreeEntry[] {
  const container = getJsonValueAt(root, path);
  const total = childCountOf(container);
  const start = Math.max(0, range?.start ?? 0);
  const end = Math.min(total, range?.end ?? total);
  const count = end - start;
  if (count <= 0) return [];

  if (count > JSON_TREE_MAX_CHILDREN) {
    const size = groupSizeFor(count);
    const ranges: JsonTreeEntry[] = [];
    for (let rangeStart = start; rangeStart < end; rangeStart += size) {
      ranges.push({
        type: "range",
        path,
        start: rangeStart,
        end: Math.min(end, rangeStart + size),
      });
    }
    return ranges;
  }

  const entries: JsonTreeEntry[] = [];
  if (Array.isArray(container)) {
    for (let index = start; index < end; index += 1) {
      entries.push(describeJsonValue(container[index], [...path, index]));
    }
  } else if (isRecord(container)) {
    const keys = keysOf(container);
    for (let index = start; index < end; index += 1) {
      const key = keys[index] ?? "";
      entries.push(describeJsonValue(container[key], [...path, key]));
    }
  }
  return entries;
}

/** A key that can follow a dot in a path; anything else is written in brackets. */
const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/;

/**
 * A path as a JSONPath expression (RFC 9535): `$.users[0].name`, with brackets for keys that are
 * not identifiers (`$["first name"]`).
 */
export function formatJsonPath(path: JsonPath): string {
  let expression = "$";
  for (const segment of path) {
    if (typeof segment === "number") expression += `[${String(segment)}]`;
    else if (IDENTIFIER_PATTERN.test(segment)) expression += `.${segment}`;
    else expression += `[${JSON.stringify(segment)}]`;
  }
  return expression;
}

/**
 * A value as it is copied: strings without their quotes, everything else as JSON, containers
 * indented.
 */
export function formatJsonValueForCopy(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "";
  return JSON.stringify(value, null, PRETTY_PRINT_INDENT);
}
