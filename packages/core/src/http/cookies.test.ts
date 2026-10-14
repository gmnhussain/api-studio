import { describe, expect, it } from "vitest";

import {
  cookiesForUrl,
  formatCookieHeader,
  isCookieExpired,
  parseSetCookie,
  updateCookieJar,
} from "./cookies";

const NOW = new Date("2026-10-14T09:30:00.000Z");

describe("parseSetCookie", () => {
  it("parses a host-only session cookie with the default path", () => {
    expect(parseSetCookie("session=abc", "https://api.acme.dev/v1/users", NOW)).toEqual({
      name: "session",
      value: "abc",
      domain: "api.acme.dev",
      hostOnly: true,
      path: "/v1",
      expiresAt: null,
      secure: false,
      httpOnly: false,
      sameSite: null,
    });
  });

  it("reads every attribute, letting Max-Age win over Expires", () => {
    const cookie = parseSetCookie(
      "id=1; Domain=.acme.dev; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Max-Age=60; Secure; HttpOnly; SameSite=Lax",
      "https://api.acme.dev/login",
      NOW,
    );

    expect(cookie).toMatchObject({
      domain: "acme.dev",
      hostOnly: false,
      path: "/",
      expiresAt: "2026-10-14T09:31:00.000Z",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
  });

  it("uses Expires without Max-Age, and Max-Age=0 deletes", () => {
    expect(
      parseSetCookie("a=1; Expires=Wed, 21 Oct 2026 07:28:00 GMT", "http://x.dev/", NOW)?.expiresAt,
    ).toBe("2026-10-21T07:28:00.000Z");
    const deleted = parseSetCookie("a=; Max-Age=0", "http://x.dev/", NOW);
    expect(deleted && isCookieExpired(deleted, NOW)).toBe(true);
  });

  it("ignores unknown attributes, bad values and relative paths", () => {
    expect(
      parseSetCookie(
        "a=1; Path=relative; Expires=soon; Max-Age=later; SameSite=Odd; Domain=; Priority=High",
        "http://x.dev/a/b",
        NOW,
      ),
    ).toMatchObject({ path: "/a", expiresAt: null, sameSite: null, hostOnly: true });
  });

  it("refuses cookies for other domains, without a name, or for a bad URL", () => {
    expect(parseSetCookie("a=1; Domain=evil.dev", "https://acme.dev/", NOW)).toBeNull();
    expect(parseSetCookie("=1", "https://acme.dev/", NOW)).toBeNull();
    expect(parseSetCookie("novalue", "https://acme.dev/", NOW)).toBeNull();
    expect(parseSetCookie("a=1", "not a url", NOW)).toBeNull();
  });
});

describe("cookie jar", () => {
  const parse = (header: string, url: string) => {
    const cookie = parseSetCookie(header, url, NOW);
    if (!cookie) throw new Error(`expected a cookie from ${header}`);
    return cookie;
  };
  const shared = parse("shared=1; Domain=acme.dev; Path=/", "https://api.acme.dev/");
  const hostOnly = parse("host=1; Path=/v1", "https://api.acme.dev/v1/users");
  const secure = parse("secure=1; Secure; Path=/", "https://api.acme.dev/");
  const expired = parse("old=1; Max-Age=0", "https://api.acme.dev/");
  const jar = [shared, hostOnly, secure, expired];

  it("sends matching cookies, longest path first", () => {
    expect(
      cookiesForUrl(jar, "https://api.acme.dev/v1/users", NOW).map((cookie) => cookie.name),
    ).toEqual(["host", "shared", "secure"]);
  });

  it("keeps host-only, path, secure and expiry rules", () => {
    // "secure" was set without Domain, so it stays with api.acme.dev.
    expect(cookiesForUrl(jar, "https://www.acme.dev/v1", NOW).map((c) => c.name)).toEqual([
      "shared",
    ]);
    expect(cookiesForUrl(jar, "http://api.acme.dev/v1x", NOW).map((c) => c.name)).toEqual([
      "shared",
    ]);
    expect(cookiesForUrl(jar, "https://acme.dev.evil.com/", NOW)).toEqual([]);
    expect(cookiesForUrl(jar, "nonsense", NOW)).toEqual([]);
  });

  it("replaces cookies by name, domain and path and drops expired ones", () => {
    const replaced = parse("shared=2; Domain=acme.dev; Path=/", "https://api.acme.dev/");
    const deleted = parse("host=; Max-Age=0; Path=/v1", "https://api.acme.dev/v1/users");

    const updated = updateCookieJar(jar, [replaced, deleted], NOW);

    expect(updated.map((cookie) => `${cookie.name}=${cookie.value}`)).toEqual([
      "shared=2",
      "secure=1",
    ]);
  });

  it("formats a Cookie header", () => {
    expect(
      formatCookieHeader([
        { name: "a", value: "1" },
        { name: "b", value: "2" },
      ]),
    ).toBe("a=1; b=2");
  });
});
