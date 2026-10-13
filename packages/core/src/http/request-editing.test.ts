import { describe, expect, it } from "vitest";

import { generatedHeaders } from "./generated-headers";
import { withPathVariables, withQueryParameters, withUrl } from "./request-editing";
import { createHttpRequestDefinition, createKeyValueEntry } from "../models/model-factories";

describe("request editing", () => {
  it("fills both tables when the URL changes", () => {
    const request = withUrl(createHttpRequestDefinition(), "{{base}}/users/:id?page=2&sort");

    expect(request.url).toBe("{{base}}/users/:id?page=2&sort");
    expect(request.queryParameters.map(({ key, value }) => [key, value])).toEqual([
      ["page", "2"],
      ["sort", ""],
    ]);
    expect(request.pathVariables.map(({ key }) => key)).toEqual(["id"]);
  });

  it("rewrites the query string when the parameter table changes", () => {
    const request = withUrl(createHttpRequestDefinition(), "https://api.dev/users?page=2#top");
    const [page] = request.queryParameters;
    if (!page) throw new Error("expected a parameter");

    const edited = withQueryParameters(request, [
      { ...page, value: "3" },
      createKeyValueEntry({ key: "limit", value: "10" }),
      createKeyValueEntry({ key: "draft", value: "1", enabled: false }),
    ]);

    expect(edited.url).toBe("https://api.dev/users?page=3&limit=10#top");
    expect(edited.queryParameters).toHaveLength(3);
  });

  it("keeps path variable rows to the names in the URL", () => {
    const request = withUrl(createHttpRequestDefinition(), "/users/:id");
    const [id] = request.pathVariables;
    if (!id) throw new Error("expected a path variable");

    const edited = withPathVariables(request, [
      { ...id, value: "42" },
      createKeyValueEntry({ key: "gone", value: "x" }),
    ]);

    expect(edited.pathVariables.map(({ key, value }) => [key, value])).toEqual([["id", "42"]]);
  });
});

describe("generatedHeaders", () => {
  const bearer = { type: "bearer", token: "{{token}}", prefix: "Bearer" } as const;

  it("lists the body's Content-Type and the auth header", () => {
    expect(
      generatedHeaders({ headers: [], body: { type: "json", text: "{}" }, auth: bearer }),
    ).toEqual([
      { name: "Content-Type", value: "application/json", source: "body", isSecret: false },
      { name: "Authorization", value: "Bearer {{token}}", source: "auth", isSecret: true },
    ]);
  });

  it("leaves out headers the user wrote, in any case, but not disabled ones", () => {
    const headers = [
      createKeyValueEntry({ key: "content-type", value: "text/csv" }),
      createKeyValueEntry({ key: "Authorization", value: "Token x", enabled: false }),
    ];

    expect(
      generatedHeaders({ headers, body: { type: "text", text: "" }, auth: bearer }).map(
        ({ name }) => name,
      ),
    ).toEqual(["Authorization"]);
  });

  it("generates nothing without a body or auth", () => {
    expect(
      generatedHeaders({ headers: [], body: { type: "none" }, auth: { type: "none" } }),
    ).toEqual([]);
  });
});
