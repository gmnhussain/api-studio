import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import type { ResolvedRequest } from "@api-studio/core";

import { toExecutionError } from "./execution-errors";
import { followRedirect, isRedirectStatus } from "./redirects";
import { decodeBody, encodeBody, readBody } from "./response-body";

const post: ResolvedRequest = {
  method: "POST",
  url: "https://api.acme.dev/login",
  headers: [
    { name: "Content-Type", value: "application/json" },
    { name: "Authorization", value: "Bearer secret" },
    { name: "X-Trace", value: "1" },
  ],
  body: { kind: "text", text: "{}" },
};

describe("followRedirect", () => {
  it("knows which statuses redirect", () => {
    expect([301, 302, 303, 307, 308].every(isRedirectStatus)).toBe(true);
    expect(isRedirectStatus(304)).toBe(false);
  });

  it("turns POST into GET on 301, 302 and 303, dropping the body and its headers", () => {
    for (const status of [301, 302, 303]) {
      const next = followRedirect(post, status, "/home");
      expect(next).toEqual({
        method: "GET",
        url: "https://api.acme.dev/home",
        headers: [
          { name: "Authorization", value: "Bearer secret" },
          { name: "X-Trace", value: "1" },
        ],
        body: { kind: "none" },
      });
    }
  });

  it("repeats the request on 307 and 308, and keeps HEAD on 303", () => {
    expect(followRedirect(post, 307, "/again")).toMatchObject({ method: "POST", body: post.body });
    expect(followRedirect({ ...post, method: "HEAD" }, 303, "/x")?.method).toBe("HEAD");
    expect(followRedirect({ ...post, method: "PUT" }, 302, "/x")?.method).toBe("PUT");
  });

  it("drops credentials when leaving the origin, and refuses non-HTTP locations", () => {
    const next = followRedirect(post, 307, "https://cdn.example.com/a");
    expect(next?.headers.map((header) => header.name)).toEqual(["Content-Type", "X-Trace"]);
    expect(followRedirect(post, 302, "ftp://files.example.com/")).toBeNull();
    expect(followRedirect(post, 302, "http://[bad")).toBeNull();
  });
});

describe("toExecutionError", () => {
  const live = new AbortController().signal;
  const withCode = (code: string, cause?: unknown) =>
    Object.assign(new Error(code), { code, ...(cause ? { cause } : {}) });

  it("tells a timeout from a cancel by the signal", () => {
    const timedOut = new AbortController();
    timedOut.abort(new DOMException("timeout", "TimeoutError"));
    const cancelled = new AbortController();
    cancelled.abort();

    expect(toExecutionError(new Error("x"), timedOut.signal).code).toBe("TIMEOUT");
    expect(toExecutionError(new Error("x"), cancelled.signal).code).toBe("ABORTED");
  });

  it.each([
    ["ENOTFOUND", "DNS"],
    ["ECONNREFUSED", "NETWORK"],
    ["UND_ERR_CONNECT_TIMEOUT", "TIMEOUT"],
    ["UND_ERR_INVALID_ARG", "INVALID_REQUEST"],
    ["BLOCKED_ADDRESS", "BLOCKED_ADDRESS"],
    ["CERT_HAS_EXPIRED", "TLS"],
    ["DEPTH_ZERO_SELF_SIGNED_CERT", "TLS"],
    ["SOMETHING_ELSE", "NETWORK"],
  ])("maps %s to %s", (code, expected) => {
    expect(toExecutionError(withCode(code), live).code).toBe(expected);
  });

  it("reads the code of a wrapped cause, and copes with non-errors", () => {
    expect(
      toExecutionError(new Error("fetch failed", { cause: withCode("ENOTFOUND") }), live).code,
    ).toBe("DNS");
    expect(toExecutionError("plain string", live)).toEqual({
      code: "NETWORK",
      message: "plain string",
    });
  });
});

describe("response bodies", () => {
  /** A body stream from text chunks that records whether it was destroyed. */
  const stream = (...parts: string[]) => {
    const state = { destroyed: false };
    const iterable = {
      [Symbol.asyncIterator]: async function* () {
        for (const part of parts) yield await Promise.resolve(Buffer.from(part));
      },
      destroy: () => {
        state.destroyed = true;
      },
    };
    return { iterable, state };
  };

  it("reads a body whole when it fits", async () => {
    expect(await readBody(stream("ab", "cd").iterable, 10)).toEqual({
      bytes: Buffer.from("abcd"),
      truncated: false,
    });
  });

  it("stops at the cap and destroys the stream", async () => {
    const body = stream("abc", "def", "ghi");
    const read = await readBody(body.iterable, 5);

    expect(read).toEqual({ bytes: Buffer.from("abcde"), truncated: true });
    expect(body.state.destroyed).toBe(true);
  });

  it("decodes gzip, deflate and brotli, also chained, and keeps unknown or broken data", () => {
    const text = Buffer.from('{"ok":true}');

    expect(decodeBody(gzipSync(text), "gzip").toString()).toBe('{"ok":true}');
    expect(decodeBody(deflateSync(text), "deflate").toString()).toBe('{"ok":true}');
    expect(decodeBody(brotliCompressSync(text), "br").toString()).toBe('{"ok":true}');
    expect(decodeBody(gzipSync(deflateSync(text)), "deflate, gzip").toString()).toBe('{"ok":true}');
    expect(decodeBody(text, "identity")).toBe(text);
    expect(decodeBody(text, "compress")).toBe(text);
    expect(decodeBody(Buffer.from("not gzip"), "gzip").toString()).toBe("not gzip");
    expect(decodeBody(text, null)).toBe(text);
  });

  it("decodes the start of a truncated gzip body", () => {
    // Varied text, so the compressed stream emits output well before its end.
    const text = Array.from({ length: 5000 }, (_, index) => String(index)).join(",");
    const compressed = gzipSync(Buffer.from(text));
    const partial = compressed.subarray(0, Math.floor(compressed.length / 2));

    expect(decodeBody(partial, "gzip").length).toBeGreaterThan(0);
  });

  it("sends text bodies as text and binary ones as base64", () => {
    expect(encodeBody(Buffer.from("hi"), "application/json", false)).toEqual({
      encoding: "text",
      data: "hi",
      contentType: "application/json",
      truncated: false,
    });
    expect(encodeBody(Buffer.from("hi"), "application/problem+json", false).encoding).toBe("text");
    expect(encodeBody(Buffer.from("hi"), null, false).encoding).toBe("text");
    expect(encodeBody(Buffer.from([0xff, 0xfe]), "text/plain", false).encoding).toBe("base64");
    expect(encodeBody(Buffer.from([1, 2, 3]), "image/png", false)).toMatchObject({
      encoding: "base64",
      data: "AQID",
    });
  });

  it("keeps a truncated text body whose last character was cut", () => {
    const cut = Buffer.from("héllo").subarray(0, 2);
    expect(encodeBody(cut, "text/plain", true)).toMatchObject({ encoding: "text", data: "h" });
  });
});
