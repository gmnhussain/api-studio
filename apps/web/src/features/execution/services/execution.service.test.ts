// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  asId,
  createHttpRequestDefinition,
  createVariable,
  createWorkspace,
  mergeVariableScopes,
  parseSetCookie,
  withUrl,
  type ExecutionResult,
  type RequestExecutor,
  type ResolvedRequest,
} from "@api-studio/core";

import type { NewConsoleEntry } from "@/features/console";
import { createDatabase, type ApiStudioDatabase } from "@/lib/db/database";

import { createExecutionService } from "./execution.service";
import { createCookieJarRepository } from "../repositories/cookie-jar.repository";
import { getInitialCookieJarState, useCookieJarStore } from "../stores/cookie-jar.store";
import { getInitialExecutionState, useExecutionStore } from "../stores/execution.store";

const NOW = new Date("2026-10-14T09:30:00.000Z");
const workspace = createWorkspace({ name: "Acme" });
const tabId = asId<"TabId">("01900000-0000-7000-8000-000000000001");
const variables = mergeVariableScopes({
  global: [
    createVariable({ key: "base", value: "https://api.acme.dev" }),
    createVariable({ key: "key", value: "s3cret", isSecret: true }),
  ],
});

let database: ApiStudioDatabase;

function responseTo(request: ResolvedRequest, cookies: string[] = []): ExecutionResult {
  return {
    outcome: "response",
    request,
    response: {
      status: 200,
      statusText: "OK",
      url: request.url,
      headers: [],
      cookies: cookies.flatMap((header) => parseSetCookie(header, request.url, NOW) ?? []),
      body: { encoding: "text", data: "{}", contentType: "application/json", truncated: false },
      sizes: {
        requestBytes: 10,
        responseHeadersBytes: 10,
        responseBodyBytes: 2,
        decodedBodyBytes: 2,
      },
      timings: {
        startedAt: NOW.toISOString(),
        timeToFirstByteMilliseconds: 5,
        downloadMilliseconds: 1,
        totalMilliseconds: 6,
      },
      redirects: [],
      httpVersion: "HTTP/1.1",
    },
  };
}

function setUp(execute: RequestExecutor["execute"]) {
  const logged: NewConsoleEntry[] = [];
  const executor: RequestExecutor = {
    id: "proxy",
    capabilities: {
      canSetForbiddenHeaders: true,
      canReadRedirectChain: true,
      bypassesCors: true,
      measuresTimings: true,
    },
    execute: vi.fn(execute),
  };
  const repository = createCookieJarRepository(database);
  const service = createExecutionService({
    store: useExecutionStore,
    cookieJarStore: useCookieJarStore,
    cookieJarRepository: repository,
    getExecutor: () => executor,
    log: (entry) => logged.push(entry),
    now: () => NOW,
  });
  return { service, executor, logged, repository };
}

const draft = (url: string) =>
  withUrl(createHttpRequestDefinition({ auth: { type: "none" } }), url);
const input = (url: string) => ({
  request: draft(url),
  variables,
  inheritedAuth: { type: "none" } as const,
});

beforeEach(() => {
  database = createDatabase(`test-${crypto.randomUUID()}`);
  useExecutionStore.setState(getInitialExecutionState());
  useCookieJarStore.setState(getInitialCookieJarState());
});

afterEach(async () => {
  await database.delete();
});

describe("execution service", () => {
  it("plans, sends and records the result, logging without secret query values", async () => {
    const { service, executor, logged } = setUp((request) => Promise.resolve(responseTo(request)));

    const result = await service.send(tabId, input("{{base}}/users?key={{key}}"));

    expect(result.outcome).toBe("response");
    expect(vi.mocked(executor.execute).mock.calls[0]?.[0].url).toBe(
      "https://api.acme.dev/users?key=s3cret",
    );
    expect(useExecutionStore.getState().executions[tabId]).toMatchObject({
      status: "done",
      executorId: "proxy",
      result: { outcome: "response" },
    });
    expect(logged).toEqual([
      expect.objectContaining({
        level: "info",
        execution: {
          method: "GET",
          url: "https://api.acme.dev/users",
          status: 200,
          totalMilliseconds: 6,
          errorCode: null,
        },
      }),
    ]);
  });

  it("refuses to send a request with unresolved variables", async () => {
    const { service, executor, logged } = setUp(() => Promise.reject(new Error("not called")));

    const result = await service.send(tabId, input("{{missing}}/users"));

    expect(result).toMatchObject({
      outcome: "error",
      request: null,
      error: { code: "UNRESOLVED_VARIABLES", message: "missing" },
    });
    expect(executor.execute).not.toHaveBeenCalled();
    expect(logged[0]).toMatchObject({
      level: "error",
      execution: { errorCode: "UNRESOLVED_VARIABLES" },
    });
    expect((await service.send(tabId, input("ftp://x.dev/"))).outcome).toBe("error");
  });

  it("keeps cookies in the workspace jar and sends them next time", async () => {
    const { service, executor, repository } = setUp((request) =>
      Promise.resolve(responseTo(request, ["session=abc; Path=/"])),
    );
    await service.openWorkspace(workspace.id);

    await service.send(tabId, input("{{base}}/login"));
    await service.send(tabId, input("{{base}}/me"));

    expect(vi.mocked(executor.execute).mock.calls[1]?.[0].headers).toContainEqual({
      name: "Cookie",
      value: "session=abc",
    });
    expect((await repository.get(workspace.id))?.cookies.map((cookie) => cookie.name)).toEqual([
      "session",
    ]);
    useCookieJarStore.setState(getInitialCookieJarState());
    await service.openWorkspace(workspace.id);
    expect(useCookieJarStore.getState().cookies).toHaveLength(1);
  });

  it("cancels the previous execution of a tab when it sends again, and on request", async () => {
    const signals: AbortSignal[] = [];
    const { service } = setUp(
      (request, { signal }) =>
        new Promise((resolve) => {
          signals.push(signal);
          signal.addEventListener("abort", () => {
            resolve({ outcome: "error", request, error: { code: "ABORTED", message: "x" } });
          });
        }),
    );

    const first = service.send(tabId, input("{{base}}/a"));
    const second = service.send(tabId, input("{{base}}/b"));
    expect(signals[0]?.aborted).toBe(true);
    expect(useExecutionStore.getState().executions[tabId]?.status).toBe("sending");

    service.cancel(tabId);
    await Promise.all([first, second]);
    expect(useExecutionStore.getState().executions[tabId]?.result).toMatchObject({
      error: { code: "ABORTED" },
    });
  });

  it("retries the exact request last sent, and forgets closed tabs", async () => {
    const { service, executor } = setUp((request) => Promise.resolve(responseTo(request)));
    expect(await service.retry(tabId)).toBeNull();

    await service.send(tabId, input("{{base}}/a"));
    await service.retry(tabId);

    const calls = vi.mocked(executor.execute).mock.calls;
    expect(calls[1]?.[0]).toEqual(calls[0]?.[0]);

    service.forgetTabs([tabId]);
    expect(useExecutionStore.getState().executions[tabId]).toBeUndefined();
  });
});
