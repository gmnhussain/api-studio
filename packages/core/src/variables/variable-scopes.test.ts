import { describe, expect, it } from "vitest";

import { mergeVariableScopes } from "./variable-scopes";
import { createVariable } from "../models/model-factories";

describe("mergeVariableScopes", () => {
  it("lets collection override global and environment override both", () => {
    const merged = mergeVariableScopes({
      global: [
        createVariable({ key: "baseUrl", value: "https://global" }),
        createVariable({ key: "token", value: "global-token" }),
      ],
      collection: [createVariable({ key: "baseUrl", value: "https://collection" })],
      environment: [createVariable({ key: "token", value: "env-token", isSecret: true })],
    });

    expect(merged.get("baseUrl")).toEqual({
      name: "baseUrl",
      value: "https://collection",
      isSecret: false,
      scope: "collection",
    });
    expect(merged.get("token")).toEqual({
      name: "token",
      value: "env-token",
      isSecret: true,
      scope: "environment",
    });
  });

  it("ignores disabled variables and variables without a name", () => {
    const merged = mergeVariableScopes({
      global: [createVariable({ key: "host", value: "global" })],
      environment: [
        createVariable({ key: "host", value: "disabled", enabled: false }),
        createVariable({ key: "   ", value: "nameless" }),
      ],
    });

    expect(merged.get("host")?.value).toBe("global");
    expect(merged.size).toBe(1);
  });

  it("trims names and lets the last definition in a scope win", () => {
    const merged = mergeVariableScopes({
      environment: [
        createVariable({ key: " host ", value: "first" }),
        createVariable({ key: "host", value: "second" }),
      ],
    });

    expect(merged.get("host")?.value).toBe("second");
  });

  it("returns an empty map without sources", () => {
    expect(mergeVariableScopes({}).size).toBe(0);
  });
});
