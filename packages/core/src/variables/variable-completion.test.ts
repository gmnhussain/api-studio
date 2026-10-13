import { describe, expect, it } from "vitest";

import { getVariableCompletion } from "./variable-completion";
import { mergeVariableScopes } from "./variable-scopes";
import { createVariable } from "../models/model-factories";

const VARIABLES = mergeVariableScopes({
  environment: ["baseUrl", "token", "userId", "authBase"].map((key) =>
    createVariable({ key, value: key }),
  ),
});

function candidateNames(text: string, cursor = text.length): string[] | null {
  return (
    getVariableCompletion(text, cursor, VARIABLES)?.candidates.map((item) => item.name) ?? null
  );
}

describe("getVariableCompletion", () => {
  it("offers every variable right after {{", () => {
    expect(candidateNames("https://{{")).toEqual(["authBase", "baseUrl", "token", "userId"]);
  });

  it("puts prefix matches before inner matches, ignoring case", () => {
    expect(candidateNames("{{BASE")).toEqual(["baseUrl", "authBase"]);
  });

  it("reports the range to replace and the query", () => {
    expect(getVariableCompletion("{{ to", 5, VARIABLES)).toMatchObject({
      from: 3,
      to: 5,
      query: "to",
    });
  });

  it("replaces past an existing closing }} after the cursor", () => {
    const text = "{{tok}}/path";

    expect(getVariableCompletion(text, 4, VARIABLES)).toMatchObject({
      from: 2,
      to: 7,
      query: "to",
    });
  });

  it.each([
    ["no braces", "https://example.com"],
    ["a single brace", "{"],
    ["a closed reference", "{{token}}"],
    ["a space inside the name", "{{ to ken"],
  ])("returns null for %s", (_case, text) => {
    expect(getVariableCompletion(text, text.length, VARIABLES)).toBeNull();
  });

  it("returns no candidates when nothing matches", () => {
    expect(candidateNames("{{zzz")).toEqual([]);
  });
});
