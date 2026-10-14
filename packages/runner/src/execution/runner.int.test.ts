import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ExecuteOptions, ExecutionResult, ResolvedRequest } from "@api-studio/core";

import { createRunner, type RunnerConfig } from "./runner";

/** A small API with one route per behaviour under test. */
function handle(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url ?? "/", "http://localhost");
  const chunks: Buffer[] = [];
  request.on("data", (chunk: Buffer) => chunks.push(chunk));
  request.on("end", () => {
    const body = Buffer.concat(chunks).toString();
    switch (url.pathname) {
      case "/echo":
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Set-Cookie", ["session=abc; Path=/; HttpOnly", "theme=dark"]);
        response.end(
          JSON.stringify({
            method: request.method,
            headers: request.headers,
            body,
            query: url.search,
          }),
        );
        return;
      case "/redirect":
        response.writeHead(Number(url.searchParams.get("status") ?? "302"), {
          Location: url.searchParams.get("to") ?? "/echo",
          "Set-Cookie": "redirected=1; Path=/",
        });
        response.end();
        return;
      case "/loop":
        response.writeHead(302, { Location: "/loop" });
        response.end();
        return;
      case "/gzip":
        response.writeHead(200, { "Content-Type": "text/plain", "Content-Encoding": "gzip" });
        response.end(gzipSync(Buffer.from("compressed hello")));
        return;
      case "/large":
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end("x".repeat(10_000));
        return;
      case "/image":
        response.writeHead(200, { "Content-Type": "image/png" });
        response.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
        return;
      case "/slow":
        setTimeout(() => response.end("late"), 2000);
        return;
      default:
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("not here");
    }
  });
}

const OPTIONS: ExecuteOptions = {
  timeoutMilliseconds: 5000,
  followRedirects: true,
  maxRedirects: 5,
};
const CONFIG: RunnerConfig = {
  allowPrivateNetworks: true,
  allowedPorts: null,
  maxResponseBytes: 1024,
  maxRequestBytes: 1024,
  maxTimeoutMilliseconds: 60_000,
};

let server: Server;
let baseUrl = "";
const runner = createRunner(CONFIG);

function get(path: string, request: Partial<ResolvedRequest> = {}): ResolvedRequest {
  return {
    method: "GET",
    url: `${baseUrl}${path}`,
    headers: [],
    body: { kind: "none" },
    ...request,
  };
}

function expectResponse(result: ExecutionResult) {
  if (result.outcome !== "response")
    throw new Error(`expected a response, got ${result.error.code}`);
  return result.response;
}

beforeAll(async () => {
  server = createServer(handle);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
});

afterAll(async () => {
  await runner.close();
  await new Promise((resolve) => server.close(resolve));
});

describe("runner", () => {
  it("sends method, headers, query and body exactly, and reports the response", async () => {
    const response = expectResponse(
      await runner.execute(
        get("/echo?q=1", {
          method: "POST",
          headers: [
            { name: "Content-Type", value: "application/json" },
            { name: "X-Repeat", value: "a" },
            { name: "X-Repeat", value: "b" },
          ],
          body: { kind: "text", text: '{"name":"Ada"}' },
        }),
        OPTIONS,
      ),
    );

    expect(response).toMatchObject({ status: 200, statusText: "OK", httpVersion: "HTTP/1.1" });
    expect(response.body.encoding).toBe("text");
    const echoed = JSON.parse(response.body.data) as {
      method: string;
      headers: Record<string, string>;
      body: string;
      query: string;
    };
    expect(echoed).toMatchObject({ method: "POST", body: '{"name":"Ada"}', query: "?q=1" });
    expect(echoed.headers["x-repeat"]).toBe("a, b");
    expect(response.cookies.map((cookie) => cookie.name)).toEqual(["session", "theme"]);
    expect(response.sizes.requestBytes).toBeGreaterThan(0);
    expect(response.sizes.responseBodyBytes).toBe(response.sizes.decodedBodyBytes);
    expect(response.timings.totalMilliseconds).toBeGreaterThanOrEqual(
      response.timings.timeToFirstByteMilliseconds ?? 0,
    );
  });

  it("sends multipart forms with their boundary", async () => {
    const response = expectResponse(
      await runner.execute(
        get("/echo", {
          method: "POST",
          body: { kind: "form_data", parts: [{ name: "name", value: "Ada" }] },
        }),
        OPTIONS,
      ),
    );
    const echoed = JSON.parse(response.body.data) as {
      headers: Record<string, string>;
      body: string;
    };

    expect(echoed.headers["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
    expect(echoed.body).toContain('name="name"');
  });

  it("follows redirects, recording each hop and the cookies they set", async () => {
    const response = expectResponse(
      await runner.execute(
        get("/redirect?status=303", { method: "POST", body: { kind: "text", text: "x" } }),
        OPTIONS,
      ),
    );

    expect(response.url).toBe(`${baseUrl}/echo`);
    expect(response.redirects).toEqual([
      { status: 303, url: `${baseUrl}/redirect?status=303`, location: "/echo" },
    ]);
    expect((JSON.parse(response.body.data) as { method: string }).method).toBe("GET");
    expect(response.cookies.map((cookie) => cookie.name)).toContain("redirected");
    const echoed = JSON.parse(response.body.data) as { headers: Record<string, string> };
    expect(echoed.headers.cookie).toBe("redirected=1");
  });

  it("returns the redirect itself when redirects are off", async () => {
    const response = expectResponse(
      await runner.execute(get("/redirect"), { ...OPTIONS, followRedirects: false }),
    );
    expect(response).toMatchObject({ status: 302, redirects: [] });
  });

  it("stops redirect loops", async () => {
    expect(await runner.execute(get("/loop"), { ...OPTIONS, maxRedirects: 3 })).toMatchObject({
      outcome: "error",
      error: { code: "TOO_MANY_REDIRECTS" },
    });
  });

  it("decompresses bodies and counts both sizes", async () => {
    const response = expectResponse(await runner.execute(get("/gzip"), OPTIONS));

    expect(response.body.data).toBe("compressed hello");
    expect(response.sizes.decodedBodyBytes).toBe("compressed hello".length);
    expect(response.sizes.responseBodyBytes).not.toBe(response.sizes.decodedBodyBytes);
  });

  it("cuts bodies at the size cap and marks them truncated", async () => {
    const response = expectResponse(await runner.execute(get("/large"), OPTIONS));

    expect(response.body).toMatchObject({ truncated: true });
    expect(response.body.data).toHaveLength(CONFIG.maxResponseBytes);
  });

  it("sends binary bodies as base64", async () => {
    const response = expectResponse(await runner.execute(get("/image"), OPTIONS));
    expect(response.body).toMatchObject({ encoding: "base64", data: "iVBORw==" });
  });

  it("reports error statuses as responses", async () => {
    expect(expectResponse(await runner.execute(get("/missing"), OPTIONS))).toMatchObject({
      status: 404,
      statusText: "Not Found",
    });
  });

  it("times out, and tells a cancel apart", async () => {
    expect(
      await runner.execute(get("/slow"), { ...OPTIONS, timeoutMilliseconds: 100 }),
    ).toMatchObject({ outcome: "error", error: { code: "TIMEOUT" } });

    const controller = new AbortController();
    const pending = runner.execute(get("/slow"), { ...OPTIONS, signal: controller.signal });
    controller.abort();
    expect(await pending).toMatchObject({ outcome: "error", error: { code: "ABORTED" } });
  });

  it("refuses request bodies over the limit", async () => {
    expect(
      await runner.execute(
        get("/echo", { method: "POST", body: { kind: "text", text: "x".repeat(2048) } }),
        OPTIONS,
      ),
    ).toMatchObject({ outcome: "error", error: { code: "REQUEST_TOO_LARGE" } });
  });

  it("maps connection failures", async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => closed.listen(0, "127.0.0.1", resolve));
    const port = (closed.address() as AddressInfo).port;
    await new Promise((resolve) => closed.close(resolve));

    expect(
      await runner.execute(get("", { url: `http://127.0.0.1:${String(port)}/` }), OPTIONS),
    ).toMatchObject({ outcome: "error", error: { code: "NETWORK" } });
    expect(
      await runner.execute(get("", { url: "http://does-not-exist.invalid/" }), OPTIONS),
    ).toMatchObject({ outcome: "error", error: { code: "DNS" } });
  });
});

describe("runner in public mode", () => {
  const publicRunner = createRunner({
    ...CONFIG,
    allowPrivateNetworks: false,
    allowedPorts: [80, 443],
  });

  afterAll(async () => {
    await publicRunner.close();
  });

  it("refuses private addresses, by literal IP and by name, and ports outside the list", async () => {
    for (const url of [
      "http://127.0.0.1/",
      "http://localhost/",
      "http://[::1]/",
      "http://10.0.0.1/",
    ]) {
      expect(await publicRunner.execute(get("", { url }), OPTIONS)).toMatchObject({
        outcome: "error",
        error: { code: "BLOCKED_ADDRESS" },
      });
    }
    expect(await publicRunner.execute(get("", { url: `${baseUrl}/echo` }), OPTIONS)).toMatchObject({
      outcome: "error",
      error: { code: "BLOCKED_ADDRESS", message: expect.stringContaining("Port") as unknown },
    });
  });
});
