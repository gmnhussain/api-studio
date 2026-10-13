import { describe, expect, it } from "vitest";

import {
  findPathVariableNames,
  replacePathVariables,
  syncPathVariablesFromUrl,
} from "./path-variables";
import { createKeyValueEntry } from "../models/model-factories";

describe("findPathVariableNames", () => {
  it.each([
    ["{{baseUrl}}/users/:id", ["id"]],
    ["https://api.example.com/orgs/:orgId/users/:userId/", ["orgId", "userId"]],
    ["/a/:id/b/:id", ["id"]],
    ["http://localhost:8080/health", []],
    ["http://[::1]:3000/items", []],
    ["/users/:id?sort=:name#:anchor", ["id"]],
    ["/files/:name.json", []],
    ["/time/12:30", []],
    ["/:1st", []],
    ["", []],
  ])("finds %j", (url, names) => {
    expect(findPathVariableNames(url)).toEqual(names);
  });
});

describe("syncPathVariablesFromUrl", () => {
  it("keeps values and notes of names still in the path, in path order", () => {
    const id = createKeyValueEntry({ key: "id", value: "42", description: "User id" });
    const removed = createKeyValueEntry({ key: "postId", value: "7" });

    const rows = syncPathVariablesFromUrl("/orgs/:orgId/users/:id", [removed, id]);

    expect(rows.map((row) => row.key)).toEqual(["orgId", "id"]);
    expect(rows[1]).toBe(id);
  });

  it("returns no rows for a URL without path variables", () => {
    expect(
      syncPathVariablesFromUrl("https://x.dev/users", [createKeyValueEntry({ key: "id" })]),
    ).toEqual([]);
  });
});

describe("replacePathVariables", () => {
  it("replaces known names and keeps the rest of the URL", () => {
    const values: Record<string, string> = { orgId: "acme", id: "42" };

    expect(
      replacePathVariables(
        "{{baseUrl}}/orgs/:orgId/users/:id?include=:id#:x",
        (name) => values[name],
      ),
    ).toBe("{{baseUrl}}/orgs/acme/users/42?include=:id#:x");
  });

  it("keeps unknown names as written", () => {
    expect(replacePathVariables("/users/:id", () => undefined)).toBe("/users/:id");
  });
});
