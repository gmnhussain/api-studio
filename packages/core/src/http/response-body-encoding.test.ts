import { describe, expect, it } from "vitest";

import { encodeResponseBody, isTextualContentType } from "./response-body-encoding";

const encoder = new TextEncoder();
const bytes = (text: string) => encoder.encode(text);

describe("encodeResponseBody", () => {
  it("sends text bodies as text and binary ones as base64", () => {
    expect(encodeResponseBody(bytes("hi"), "application/json", false)).toEqual({
      encoding: "text",
      data: "hi",
      contentType: "application/json",
      truncated: false,
    });
    expect(encodeResponseBody(bytes("hi"), "application/problem+json", false).encoding).toBe(
      "text",
    );
    expect(encodeResponseBody(bytes("hi"), null, false).encoding).toBe("text");
    expect(encodeResponseBody(new Uint8Array([0xff, 0xfe]), "text/plain", false).encoding).toBe(
      "base64",
    );
    expect(encodeResponseBody(new Uint8Array([1, 2, 3]), "image/png", false)).toMatchObject({
      encoding: "base64",
      data: "AQID",
    });
    expect(isTextualContentType("image/svg+xml")).toBe(true);
  });

  it("keeps a truncated text body whose last character was cut", () => {
    const cut = bytes("héllo").subarray(0, 2);
    expect(encodeResponseBody(cut, "text/plain", true)).toMatchObject({
      encoding: "text",
      data: "h",
    });
  });

  it("encodes large binary bodies in chunks", () => {
    const large = new Uint8Array(100_000).fill(0xff);
    expect(atob(encodeResponseBody(large, "application/octet-stream", false).data)).toHaveLength(
      100_000,
    );
  });
});
