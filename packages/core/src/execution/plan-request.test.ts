import { describe, expect, it } from "vitest";

import { planRequest, type PlanInput } from "./plan-request";
import { parseSetCookie } from "../http/cookies";
import { withUrl } from "../http/request-editing";
import {
  createHttpRequestDefinition,
  createKeyValueEntry,
  createVariable,
} from "../models/model-factories";
import { mergeVariableScopes } from "../variables/variable-scopes";

const NOW = new Date("2026-10-14T09:30:00.000Z");
const variables = mergeVariableScopes({
  global: [
    createVariable({ key: "baseUrl", value: "https://api.acme.dev" }),
    createVariable({ key: "token", value: "s3cret", isSecret: true }),
    createVariable({ key: "name", value: "Ada" }),
  ],
});

function plan(overrides: Partial<PlanInput["request"]>, input: Partial<PlanInput> = {}) {
  const request = withUrl(
    createHttpRequestDefinition({ auth: { type: "none" }, ...overrides }),
    overrides.url ?? "{{baseUrl}}/users",
  );
  return planRequest({
    request,
    variables,
    inheritedAuth: { type: "none" },
    now: NOW,
    ...input,
  });
}

function expectPlanned(result: ReturnType<typeof planRequest>) {
  if (!result.ok) throw new Error(`expected a request, got ${result.error.code}`);
  return result.value;
}

describe("planRequest", () => {
  it("resolves variables, fills path variables and normalizes the URL", () => {
    const request = withUrl(
      createHttpRequestDefinition(),
      "{{baseUrl}}/users/:id/posts/:post?q=a b",
    );
    const [id, post] = request.pathVariables;
    if (!id || !post) throw new Error("expected path variables");

    const planned = expectPlanned(
      planRequest({
        request: { ...request, pathVariables: [{ ...id, value: "{{name}}" }, post] },
        variables,
        inheritedAuth: { type: "none" },
      }),
    );

    expect(planned.request.url).toBe("https://api.acme.dev/users/Ada/posts/:post?q=a%20b");
    expect(planned.usesSecrets).toBe(false);
  });

  it("assumes http:// without a scheme and refuses other schemes and bad URLs", () => {
    expect(expectPlanned(plan({ url: "localhost:3000/ping" })).request.url).toBe(
      "http://localhost:3000/ping",
    );
    expect(plan({ url: "ftp://files.acme.dev/x" })).toEqual({
      ok: false,
      error: { code: "INVALID_REQUEST", reason: "unsupported_scheme", detail: "ftp:" },
    });
    expect(plan({ url: "http://" })).toMatchObject({
      ok: false,
      error: { code: "INVALID_REQUEST", reason: "invalid_url" },
    });
  });

  it("refuses to send with unresolved variables, naming each once", () => {
    expect(plan({ url: "{{missing}}/a/{{missing}}/{{other}}" })).toEqual({
      ok: false,
      error: { code: "UNRESOLVED_VARIABLES", names: ["missing", "other"] },
    });
  });

  it("sends enabled headers, refusing invalid names", () => {
    const headers = [
      createKeyValueEntry({ key: "X-Name", value: "{{name}}" }),
      createKeyValueEntry({ key: "X-Off", value: "1", enabled: false }),
    ];
    expect(expectPlanned(plan({ headers })).request.headers).toEqual([
      { name: "X-Name", value: "Ada" },
    ]);
    expect(plan({ headers: [createKeyValueEntry({ key: "Bad Name", value: "1" })] })).toMatchObject(
      {
        ok: false,
        error: { reason: "invalid_header_name", detail: "Bad Name" },
      },
    );
  });

  it("applies resolved auth, inherited when the request inherits, and notes secrets", () => {
    const own = expectPlanned(
      plan({ auth: { type: "bearer", token: "{{token}}", prefix: "Bearer" } }),
    );
    expect(own.request.headers).toContainEqual({ name: "Authorization", value: "Bearer s3cret" });
    expect(own.usesSecrets).toBe(true);

    const inherited = expectPlanned(
      plan(
        { auth: { type: "inherit" } },
        { inheritedAuth: { type: "api_key", key: "key", value: "{{name}}", placement: "query" } },
      ),
    );
    expect(inherited.request.url).toBe("https://api.acme.dev/users?key=Ada");

    for (const auth of [
      { type: "basic", username: "{{name}}", password: "x" },
      {
        type: "oauth2",
        grantType: "client_credentials",
        accessTokenUrl: "",
        clientId: "",
        clientSecret: "",
        scope: "",
        accessToken: "{{token}}",
      },
    ] as const) {
      expect(expectPlanned(plan({ auth })).request.headers[0]?.name).toBe("Authorization");
    }
  });

  it("serializes every body type with its default Content-Type, except multipart", () => {
    const entry = createKeyValueEntry({ key: "name", value: "{{name}}" });
    const json = expectPlanned(
      plan({ method: "POST", body: { type: "json", text: '{"n":"{{name}}"}' } }),
    );
    expect(json.request.body).toEqual({ kind: "text", text: '{"n":"Ada"}' });
    expect(json.request.headers).toContainEqual({
      name: "Content-Type",
      value: "application/json",
    });

    const form = expectPlanned(
      plan({ body: { type: "form_data", entries: [{ ...entry, kind: "text" }] } }),
    );
    expect(form.request.body).toEqual({
      kind: "form_data",
      parts: [{ name: "name", value: "Ada" }],
    });
    expect(form.request.headers).toEqual([]);

    expect(
      expectPlanned(plan({ body: { type: "url_encoded", entries: [entry] } })).request.body,
    ).toEqual({
      kind: "text",
      text: "name=Ada",
    });
    expect(expectPlanned(plan({ body: { type: "xml", text: "<a/>" } })).request.body.kind).toBe(
      "text",
    );
    expect(expectPlanned(plan({ body: { type: "text", text: "hi" } })).request.body.kind).toBe(
      "text",
    );
    expect(expectPlanned(plan({ body: { type: "binary", fileName: null } })).request.body).toEqual({
      kind: "none",
    });
  });

  it("sends written cookies and matching jar cookies, unless a Cookie header is written", () => {
    const jarCookie = parseSetCookie("session=jar; Path=/", "https://api.acme.dev/", NOW);
    const shadowed = parseSetCookie("theme=jar; Path=/", "https://api.acme.dev/", NOW);
    if (!jarCookie || !shadowed) throw new Error("expected cookies");
    const cookies = [createKeyValueEntry({ key: "theme", value: "dark" })];

    const planned = expectPlanned(plan({ cookies }, { cookieJar: [jarCookie, shadowed] }));
    expect(planned.request.headers).toEqual([{ name: "Cookie", value: "theme=dark; session=jar" }]);

    const written = expectPlanned(
      plan(
        { cookies, headers: [createKeyValueEntry({ key: "cookie", value: "mine=1" })] },
        { cookieJar: [jarCookie] },
      ),
    );
    expect(written.request.headers).toEqual([{ name: "cookie", value: "mine=1" }]);
  });
});
