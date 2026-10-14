// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import type { ExecutionResult, ResolvedRequest } from "@api-studio/core";

import { BROWSER_MAX_RESPONSE_BYTES, createBrowserExecutor } from "./browser-executor";
import { createProxyExecutor, EXECUTIONS_ENDPOINT } from "./proxy-executor";

const request: ResolvedRequest = {
  method: "POST",
  url: "https://api.acme.dev/users",
  headers: [{ name: "Content-Type", value: "application/json" }],
  body: { kind: "text", text: "{}" },
};
const OPTIONS = { timeoutMilliseconds: 1000, followRedirects: true, maxRedirects: 5 };
const live = () => new AbortController().signal;

const resultFromProxy: ExecutionResult = {
  outcome: "error",
  request,
  error: { code: "DNS", message: "ENOTFOUND" },
};

describe("proxy executor", () => {
  it("posts the request to the proxy and returns its validated result", async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(Response.json(resultFromProxy)));
    const executor = createProxyExecutor(fetchMock);

    expect(await executor.execute(request, { ...OPTIONS, signal: live() })).toEqual(
      resultFromProxy,
    );
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(EXECUTIONS_ENDPOINT);
    expect(typeof init?.body === "string" ? JSON.parse(init.body) : null).toEqual({
      request,
      options: OPTIONS,
    });
  });

  it("reports an unreachable, failing or confused proxy as unavailable", async () => {
    const answers: (() => Promise<Response>)[] = [
      () => Promise.reject(new TypeError("Failed to fetch")),
      () => Promise.resolve(new Response("oops", { status: 502 })),
      () => Promise.resolve(Response.json({ unexpected: true })),
      () => Promise.resolve(new Response("not json")),
    ];
    for (const answer of answers) {
      const executor = createProxyExecutor(() => answer());
      expect(await executor.execute(request, { ...OPTIONS, signal: live() })).toMatchObject({
        outcome: "error",
        error: { code: "PROXY_UNAVAILABLE" },
      });
    }
  });

  it("reports a cancel as aborted", async () => {
    const controller = new AbortController();
    const executor = createProxyExecutor(() => {
      controller.abort();
      return Promise.reject(new DOMException("aborted", "AbortError"));
    });

    expect(
      await executor.execute(request, { ...OPTIONS, signal: controller.signal }),
    ).toMatchObject({
      error: { code: "ABORTED" },
    });
  });
});

describe("browser executor", () => {
  it("sends the request itself and reports what the browser lets it see", async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response('{"id":1}', {
          status: 201,
          statusText: "Created",
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const executor = createBrowserExecutor(fetchMock);

    const result = await executor.execute(request, { ...OPTIONS, signal: live() });

    expect(result).toMatchObject({
      outcome: "response",
      response: {
        status: 201,
        statusText: "Created",
        body: { encoding: "text", data: '{"id":1}', truncated: false },
        cookies: [],
        redirects: [],
      },
    });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST", redirect: "follow" });
    expect(executor.capabilities.bypassesCors).toBe(false);
  });

  it("sends forms as multipart and keeps redirects manual when asked", async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    const executor = createBrowserExecutor(fetchMock);

    await executor.execute(
      { ...request, body: { kind: "form_data", parts: [{ name: "a", value: "1" }] } },
      { ...OPTIONS, followRedirects: false, signal: live() },
    );

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.redirect).toBe("manual");
  });

  it("cuts bodies over the cap", async () => {
    const executor = createBrowserExecutor(() =>
      Promise.resolve(new Response(new Uint8Array(BROWSER_MAX_RESPONSE_BYTES + 10))),
    );

    const result = await executor.execute(
      { ...request, body: { kind: "none" } },
      { ...OPTIONS, signal: live() },
    );

    expect(result.outcome === "response" && result.response.body.truncated).toBe(true);
  });

  it("explains failures: network, timeout and cancel", async () => {
    const failing = createBrowserExecutor(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(await failing.execute(request, { ...OPTIONS, signal: live() })).toMatchObject({
      error: { code: "NETWORK" },
    });

    const slow = createBrowserExecutor(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    expect(
      await slow.execute(request, { ...OPTIONS, timeoutMilliseconds: 20, signal: live() }),
    ).toMatchObject({ error: { code: "TIMEOUT" } });

    const controller = new AbortController();
    const pending = slow.execute(request, { ...OPTIONS, signal: controller.signal });
    controller.abort();
    expect(await pending).toMatchObject({ error: { code: "ABORTED" } });
  });
});
