import { describe, expect, it } from "vitest";

import { createKeyValueEntry } from "@api-studio/core";

import { bodyFields, bodyText, createFormDataEntry } from "./body-conversion";
import { formatJson } from "./format-json";

describe("body conversion", () => {
  it("keeps text between text body types and nothing from others", () => {
    expect(bodyText({ type: "json", text: "{}" })).toBe("{}");
    expect(bodyText({ type: "xml", text: "<a/>" })).toBe("<a/>");
    expect(bodyText({ type: "none" })).toBe("");
  });

  it("keeps fields between form body types", () => {
    const field = createFormDataEntry({ key: "name", value: "Ada" });
    const encoded = createKeyValueEntry({ key: "page", value: "2" });

    expect(bodyFields({ type: "form_data", entries: [field] })).toEqual([
      { id: field.id, key: "name", value: "Ada", enabled: true, description: "" },
    ]);
    expect(bodyFields({ type: "url_encoded", entries: [encoded] })).toEqual([encoded]);
    expect(bodyFields({ type: "text", text: "x" })).toEqual([]);
  });
});

describe("formatJson", () => {
  it("indents valid JSON and refuses anything else", () => {
    expect(formatJson('{"a":[1,2]}')).toEqual({
      ok: true,
      value: '{\n  "a": [\n    1,\n    2\n  ]\n}',
    });
    expect(formatJson('{"a": {{value}}}')).toEqual({ ok: false, error: "invalid_json" });
  });
});
