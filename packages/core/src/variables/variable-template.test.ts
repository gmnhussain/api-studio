import { describe, expect, it } from "vitest";

import {
  findVariableReferences,
  replaceVariableReferences,
  tokenizeTemplate,
  type TemplateToken,
} from "./variable-template";

function rebuild(tokens: TemplateToken[]): string {
  return tokens.map((token) => (token.type === "text" ? token.value : token.raw)).join("");
}

describe("tokenizeTemplate", () => {
  it("splits text and references with positions", () => {
    const text = "{{baseUrl}}/users/{{ userId }}?limit=10";

    expect(tokenizeTemplate(text)).toEqual([
      { type: "variable", name: "baseUrl", raw: "{{baseUrl}}", start: 0, end: 11 },
      { type: "text", value: "/users/" },
      { type: "variable", name: "userId", raw: "{{ userId }}", start: 18, end: 30 },
      { type: "text", value: "?limit=10" },
    ]);
  });

  it.each([
    "",
    "plain text",
    "{{unclosed",
    "{{ has space }}",
    "{single}",
    "{{}}",
    "{{a}}{{b}}",
    'json {"a": {{value}}}',
  ])("round-trips %j", (text) => {
    expect(rebuild(tokenizeTemplate(text))).toBe(text);
  });

  it("treats invalid names between braces as plain text", () => {
    expect(tokenizeTemplate("{{ has space }}")).toEqual([
      { type: "text", value: "{{ has space }}" },
    ]);
  });

  it("accepts dots, dashes and underscores in names", () => {
    expect(findVariableReferences("{{api.v2-base_url}}")).toEqual(["api.v2-base_url"]);
  });
});

describe("findVariableReferences", () => {
  it("lists each name once, in order", () => {
    expect(findVariableReferences("{{b}} {{a}} {{b}}")).toEqual(["b", "a"]);
  });
});

describe("replaceVariableReferences", () => {
  it("replaces known names and keeps unknown references as written", () => {
    const values: Record<string, string> = { host: "api.example.com" };

    expect(replaceVariableReferences("https://{{host}}/{{ path }}", (name) => values[name])).toBe(
      "https://api.example.com/{{ path }}",
    );
  });

  it("inserts values literally, even with replacement patterns", () => {
    expect(replaceVariableReferences("{{price}}", () => "$& $1")).toBe("$& $1");
  });
});
