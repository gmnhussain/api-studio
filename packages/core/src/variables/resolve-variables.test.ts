import { describe, expect, it } from "vitest";

import {
  hasUndefinedVariables,
  MAX_VARIABLE_NESTING_DEPTH,
  resolveVariables,
} from "./resolve-variables";
import { mergeVariableScopes } from "./variable-scopes";
import { createVariable } from "../models/model-factories";

function variables(values: Record<string, string>, secrets: readonly string[] = []) {
  return mergeVariableScopes({
    environment: Object.entries(values).map(([key, value]) =>
      createVariable({ key, value, isSecret: secrets.includes(key) }),
    ),
  });
}

describe("resolveVariables", () => {
  it("replaces every reference with its value", () => {
    const result = resolveVariables(
      "{{baseUrl}}/users/{{ id }}",
      variables({ baseUrl: "https://api.example.com", id: "42" }),
    );

    expect(result).toEqual({
      value: "https://api.example.com/users/42",
      unresolved: [],
      usesSecrets: false,
    });
  });

  it("resolves variables that reference other variables", () => {
    const result = resolveVariables(
      "{{baseUrl}}",
      variables({ baseUrl: "https://{{host}}:{{port}}", host: "localhost", port: "8080" }),
    );

    expect(result.value).toBe("https://localhost:8080");
  });

  it("keeps undefined references and reports them once", () => {
    const result = resolveVariables(
      "{{missing}}/{{missing}}/{{known}}",
      variables({ known: "ok" }),
    );

    expect(result.value).toBe("{{missing}}/{{missing}}/ok");
    expect(result.unresolved).toEqual([{ name: "missing", reason: "undefined" }]);
  });

  it("reports undefined references found inside other values", () => {
    const result = resolveVariables("{{url}}", variables({ url: "https://{{host}}" }));

    expect(result.value).toBe("https://{{host}}");
    expect(result.unresolved).toEqual([{ name: "host", reason: "undefined" }]);
  });

  it("stops at cycles instead of looping", () => {
    const result = resolveVariables("{{a}}", variables({ a: "<{{b}}>", b: "[{{a}}]" }));

    expect(result.value).toBe("<[{{a}}]>");
    expect(result.unresolved).toEqual([{ name: "a", reason: "cycle" }]);
  });

  it("stops at a self-reference", () => {
    const result = resolveVariables("{{loop}}", variables({ loop: "x{{loop}}" }));

    expect(result.value).toBe("x{{loop}}");
    expect(result.unresolved).toEqual([{ name: "loop", reason: "cycle" }]);
  });

  it(`stops after ${String(MAX_VARIABLE_NESTING_DEPTH)} levels of nesting`, () => {
    const chain = Object.fromEntries(
      Array.from({ length: MAX_VARIABLE_NESTING_DEPTH + 2 }, (_, level) => [
        `level${String(level)}`,
        `{{level${String(level + 1)}}}`,
      ]),
    );

    const result = resolveVariables("{{level0}}", variables(chain));

    expect(result.unresolved).toEqual([
      { name: `level${String(MAX_VARIABLE_NESTING_DEPTH)}`, reason: "too_deep" },
    ]);
  });

  it("reports when a secret value was used", () => {
    expect(
      resolveVariables("Bearer {{token}}", variables({ token: "s3cret" }, ["token"])).usesSecrets,
    ).toBe(true);
    expect(resolveVariables("{{token}}", variables({}, ["token"])).usesSecrets).toBe(false);
  });

  it("leaves text without references unchanged", () => {
    expect(resolveVariables("https://example.com", variables({}))).toEqual({
      value: "https://example.com",
      unresolved: [],
      usesSecrets: false,
    });
  });
});

describe("hasUndefinedVariables", () => {
  it("is true only when a referenced name is missing", () => {
    const known = variables({ host: "localhost" });

    expect(hasUndefinedVariables("{{host}}", known)).toBe(false);
    expect(hasUndefinedVariables("{{host}}/{{path}}", known)).toBe(true);
    expect(hasUndefinedVariables("no references", known)).toBe(false);
  });
});
