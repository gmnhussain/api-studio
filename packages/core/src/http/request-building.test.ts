import { describe, expect, it } from "vitest";

import { applyAuth, resolveInheritedAuth } from "./apply-auth";
import { addHeaderIfMissing, getHeader, hasHeader, isValidHeaderName } from "./headers";
import { measureBodyBytes, measureRequestBytes } from "./request-size";
import { defaultContentType, serializeBody } from "./serialize-body";
import type { AuthConfig } from "../models/auth.schema";
import { createKeyValueEntry } from "../models/model-factories";
import type { RequestBody } from "../models/request-body.schema";

describe("headers", () => {
  it.each([
    ["Content-Type", true],
    ["X-Api-Key", true],
    ["x_custom.v2", true],
    ["", false],
    ["Bad Header", false],
    ["Colon:", false],
    ["Ünïcode", false],
  ])("validates %j as %s", (name, valid) => {
    expect(isValidHeaderName(name)).toBe(valid);
  });

  it("finds headers ignoring case and never replaces an existing one", () => {
    const headers = [{ name: "content-type", value: "text/plain" }];

    expect(hasHeader(headers, "Content-Type")).toBe(true);
    expect(getHeader(headers, "CONTENT-TYPE")).toBe("text/plain");
    expect(
      addHeaderIfMissing(headers, { name: "Content-Type", value: "application/json" }),
    ).toEqual(headers);
    expect(addHeaderIfMissing(headers, { name: "Accept", value: "*/*" })).toHaveLength(2);
  });
});

describe("serializeBody and defaultContentType", () => {
  const name = createKeyValueEntry({ key: "name", value: "Ada Lovelace" });
  const disabled = createKeyValueEntry({ key: "debug", value: "1", enabled: false });
  const nameless = createKeyValueEntry({ key: "", value: "orphan" });

  it.each<[RequestBody, string | null]>([
    [{ type: "none" }, null],
    [{ type: "json", text: "{}" }, "application/json"],
    [{ type: "text", text: "" }, "text/plain"],
    [{ type: "xml", text: "<a/>" }, "application/xml"],
    [{ type: "form_data", entries: [] }, "multipart/form-data"],
    [{ type: "url_encoded", entries: [] }, "application/x-www-form-urlencoded"],
    [{ type: "binary", fileName: null }, "application/octet-stream"],
  ])("gives %j the content type %j", (body, contentType) => {
    expect(defaultContentType(body)).toBe(contentType);
  });

  it("sends text bodies as written", () => {
    expect(serializeBody({ type: "json", text: '{"a":1}' })).toEqual({
      kind: "text",
      text: '{"a":1}',
    });
  });

  it("encodes URL-encoded forms like browsers do, leaving out disabled and nameless rows", () => {
    const body = serializeBody({
      type: "url_encoded",
      entries: [name, disabled, nameless, createKeyValueEntry({ key: "q", value: "a&b=c" })],
    });

    expect(body).toEqual({ kind: "text", text: "name=Ada+Lovelace&q=a%26b%3Dc" });
  });

  it("sends multipart fields as parts", () => {
    const body = serializeBody({
      type: "form_data",
      entries: [
        { ...name, kind: "text" },
        { ...disabled, kind: "text" },
      ],
    });

    expect(body).toEqual({ kind: "form_data", parts: [{ name: "name", value: "Ada Lovelace" }] });
  });

  it("sends nothing for no body and for binary placeholders", () => {
    expect(serializeBody({ type: "none" })).toEqual({ kind: "none" });
    expect(serializeBody({ type: "binary", fileName: "photo.png" })).toEqual({ kind: "none" });
  });
});

describe("resolveInheritedAuth", () => {
  const bearer: AuthConfig = { type: "bearer", token: "abc", prefix: "Bearer" };

  it("takes the nearest auth that is not inherit", () => {
    expect(resolveInheritedAuth([{ type: "inherit" }, { type: "inherit" }, bearer])).toBe(bearer);
    expect(resolveInheritedAuth([{ type: "none" }, bearer])).toEqual({ type: "none" });
  });

  it("means no auth when everything inherits", () => {
    expect(resolveInheritedAuth([{ type: "inherit" }])).toEqual({ type: "none" });
    expect(resolveInheritedAuth([])).toEqual({ type: "none" });
  });
});

describe("applyAuth", () => {
  const target = { url: "https://x.dev/users", headers: [] };

  it("adds Basic credentials as UTF-8 base64", () => {
    const result = applyAuth(target, { type: "basic", username: "jöhn", password: "pässword" });

    expect(result.headers).toEqual([
      {
        name: "Authorization",
        value: `Basic ${Buffer.from("jöhn:pässword", "utf8").toString("base64")}`,
      },
    ]);
  });

  it("adds a bearer token with its prefix, or alone without one", () => {
    expect(applyAuth(target, { type: "bearer", token: "abc", prefix: "Bearer" }).headers).toEqual([
      { name: "Authorization", value: "Bearer abc" },
    ]);
    expect(applyAuth(target, { type: "bearer", token: "abc", prefix: " " }).headers).toEqual([
      { name: "Authorization", value: "abc" },
    ]);
  });

  it("adds an API key as a header or as an encoded query parameter", () => {
    expect(
      applyAuth(target, { type: "api_key", key: "X-Api-Key", value: "k1", placement: "header" })
        .headers,
    ).toEqual([{ name: "X-Api-Key", value: "k1" }]);
    expect(
      applyAuth(
        { ...target, url: "https://x.dev/users?page=2#top" },
        { type: "api_key", key: "api key", value: "a&b", placement: "query" },
      ).url,
    ).toBe("https://x.dev/users?page=2&api%20key=a%26b#top");
  });

  it("sends an OAuth 2.0 access token as a bearer token", () => {
    const auth: AuthConfig = {
      type: "oauth2",
      grantType: "client_credentials",
      accessTokenUrl: "",
      clientId: "",
      clientSecret: "",
      scope: "",
      accessToken: "tok",
    };

    expect(applyAuth(target, auth).headers).toEqual([
      { name: "Authorization", value: "Bearer tok" },
    ]);
  });

  it("never replaces an Authorization header the user wrote", () => {
    const own = { url: target.url, headers: [{ name: "authorization", value: "Custom 1" }] };

    expect(applyAuth(own, { type: "bearer", token: "abc", prefix: "Bearer" })).toEqual(own);
  });

  it.each<AuthConfig>([
    { type: "none" },
    { type: "inherit" },
    { type: "basic", username: "", password: "" },
    { type: "bearer", token: "", prefix: "Bearer" },
    { type: "api_key", key: "", value: "v", placement: "header" },
  ])("adds nothing for %j", (auth) => {
    expect(applyAuth(target, auth)).toEqual(target);
  });
});

describe("request size", () => {
  it("counts the start line, headers, blank line and body", () => {
    const bytes = measureRequestBytes({
      method: "POST",
      url: "https://x.dev/users?a=1#ignored",
      headers: [{ name: "Content-Type", value: "application/json" }],
      body: { kind: "text", text: '{"name":"Ada"}' },
    });

    const expected =
      "POST /users?a=1 HTTP/1.1\r\nContent-Type: application/json\r\n\r\n" + '{"name":"Ada"}';
    expect(bytes).toBe(new TextEncoder().encode(expected).length);
  });

  it("uses / as the target for a bare origin and counts UTF-8 bytes", () => {
    const bytes = measureRequestBytes({
      method: "GET",
      url: "https://x.dev",
      headers: [{ name: "X-Name", value: "café" }],
      body: { kind: "none" },
    });

    expect(bytes).toBe(new TextEncoder().encode("GET / HTTP/1.1\r\nX-Name: café\r\n\r\n").length);
  });

  it("estimates a multipart body with a 40-character boundary", () => {
    const boundary = "x".repeat(40);
    const multipart =
      `--${boundary}\r\nContent-Disposition: form-data; name="a"\r\n\r\n1\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="b"\r\n\r\nzwei\r\n` +
      `--${boundary}--\r\n`;

    expect(
      measureBodyBytes({
        kind: "form_data",
        parts: [
          { name: "a", value: "1" },
          { name: "b", value: "zwei" },
        ],
      }),
    ).toBe(new TextEncoder().encode(multipart).length);
    expect(measureBodyBytes({ kind: "form_data", parts: [] })).toBe(0);
  });
});
