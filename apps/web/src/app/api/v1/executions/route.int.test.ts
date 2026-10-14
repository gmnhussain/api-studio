// @vitest-environment node
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { executionResultSchema } from "@api-studio/core";

import { POST } from "./route";

vi.mock("server-only", () => ({}));

let server: Server;
let target = "";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/v1/executions", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeAll(async () => {
  server = createServer((_request, response) => {
    response.writeHead(201, { "Content-Type": "application/json" });
    response.end('{"created":true}');
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  target = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}/users`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("POST /api/v1/executions", () => {
  it("executes a valid request and returns the result", async () => {
    const response = await post({
      request: { method: "POST", url: target, headers: [], body: { kind: "text", text: "{}" } },
      options: { timeoutMilliseconds: 5000, followRedirects: true, maxRedirects: 5 },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const result = executionResultSchema.parse(await response.json());
    expect(result).toMatchObject({ outcome: "response", response: { status: 201 } });
  });

  it("answers unreadable JSON with problem details", async () => {
    const response = await post("{not json");

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await response.json()).toMatchObject({
      status: 400,
      title: "The body is not valid JSON",
    });
  });

  it("lists what is wrong with an invalid execution request", async () => {
    const response = await post({ request: { method: "BREW", url: target }, options: {} });

    expect(response.status).toBe(400);
    const problem = (await response.json()) as { errors: string[] };
    expect(problem.errors.some((error) => error.startsWith("request.method"))).toBe(true);
  });
});
