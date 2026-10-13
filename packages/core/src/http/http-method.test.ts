import { describe, expect, it } from "vitest";

import { HTTP_METHODS, isBodyConventional, isHttpMethod } from "./http-method";

describe("isHttpMethod", () => {
  it.each(HTTP_METHODS)("accepts %s", (method) => {
    expect(isHttpMethod(method)).toBe(true);
  });

  it.each(["get", "Post", "TRACE", "CONNECT", "", " GET"])("rejects %j", (value) => {
    expect(isHttpMethod(value)).toBe(false);
  });

  it.each([undefined, null, 1, {}, ["GET"]])("rejects non-string %j", (value) => {
    expect(isHttpMethod(value)).toBe(false);
  });
});

describe("isBodyConventional", () => {
  it.each([
    ["GET", false],
    ["HEAD", false],
    ["OPTIONS", false],
    ["POST", true],
    ["PUT", true],
    ["PATCH", true],
    ["DELETE", true],
  ] as const)("%s → %s", (method, expected) => {
    expect(isBodyConventional(method)).toBe(expected);
  });
});
