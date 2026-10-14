import { describe, expect, it } from "vitest";

import { createBodyTaskHandler } from "./body-tasks";

const text = JSON.stringify({ users: [{ id: 1, name: "Ada" }], total: 1 });

describe("createBodyTaskHandler", () => {
  it("pretty-prints bodies with a formatter and leaves the rest alone", () => {
    const handle = createBodyTaskHandler();
    expect(handle("prettyPrint", { format: "json", text: '{"a":1}' })).toBe('{\n  "a": 1\n}');
    expect(handle("prettyPrint", { format: "text", text: "plain" })).toBeNull();
  });

  it("keeps an opened document for listing children and copying values", () => {
    const handle = createBodyTaskHandler();
    expect(handle("openJsonDocument", { documentId: "a", text })).toMatchObject({
      kind: "object",
      childCount: 2,
    });
    expect(
      handle("listJsonChildren", { documentId: "a", path: ["users"] }).map((entry) => entry.path),
    ).toEqual([["users", 0]]);
    expect(handle("copyJsonValue", { documentId: "a", path: ["users", 0, "name"] })).toBe("Ada");
    expect(handle("copyJsonValue", { documentId: "a", path: ["users", 0] })).toBe(
      '{\n  "id": 1,\n  "name": "Ada"\n}',
    );
  });

  it("answers null for text that is not JSON, and opens nothing", () => {
    const handle = createBodyTaskHandler();
    expect(handle("openJsonDocument", { documentId: "a", text: "{nope" })).toBeNull();
    expect(() => handle("listJsonChildren", { documentId: "a", path: [] })).toThrow(/not open/);
  });

  it("forgets a closed document", () => {
    const handle = createBodyTaskHandler();
    handle("openJsonDocument", { documentId: "a", text: "[1]" });
    handle("closeJsonDocument", { documentId: "a" });
    expect(() => handle("copyJsonValue", { documentId: "a", path: [0] })).toThrow(/not open/);
  });

  it("opens a document whose root is null", () => {
    const handle = createBodyTaskHandler();
    expect(handle("openJsonDocument", { documentId: "a", text: "null" })).toMatchObject({
      kind: "null",
    });
    expect(handle("copyJsonValue", { documentId: "a", path: [] })).toBe("null");
  });
});
