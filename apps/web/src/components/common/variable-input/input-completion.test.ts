import { describe, expect, it } from "vitest";

import { createVariable, mergeVariableScopes } from "@api-studio/core";

import { getCompletionOptions } from "./input-completion";

const variables = mergeVariableScopes({
  global: [createVariable({ key: "baseUrl", value: "https://api.dev" })],
  environment: [createVariable({ key: "token", value: "secret", isSecret: true })],
});

describe("getCompletionOptions", () => {
  it("completes an open {{ with matching variables and closes the reference", () => {
    const value = "{{ba/users";
    const [option] = getCompletionOptions({ value, caret: 4, variables });

    expect(option).toMatchObject({
      kind: "variable",
      label: "baseUrl",
      nextValue: "{{baseUrl}}/users",
      caret: 11,
    });
  });

  it("replaces a partial name and the closing braces already typed", () => {
    const options = getCompletionOptions({ value: "{{to}}", caret: 4, variables });

    expect(options.map((option) => option.nextValue)).toEqual(["{{token}}"]);
  });

  it("lists every variable right after {{", () => {
    expect(getCompletionOptions({ value: "{{", caret: 2, variables })).toHaveLength(2);
  });

  it("suggests whole values by prefix, ignoring case, but not an exact match", () => {
    const suggestions = ["Accept", "Accept-Language", "Authorization"];

    expect(
      getCompletionOptions({ value: "acc", caret: 3, variables, suggestions }).map(
        (option) => option.label,
      ),
    ).toEqual(["Accept", "Accept-Language"]);
    expect(
      getCompletionOptions({ value: "Accept", caret: 6, variables, suggestions }).map(
        (option) => option.label,
      ),
    ).toEqual(["Accept-Language"]);
    expect(getCompletionOptions({ value: " ", caret: 1, variables, suggestions })).toEqual([]);
  });

  it("offers nothing outside a reference without suggestions", () => {
    expect(getCompletionOptions({ value: "https://", caret: 8, variables })).toEqual([]);
  });
});
