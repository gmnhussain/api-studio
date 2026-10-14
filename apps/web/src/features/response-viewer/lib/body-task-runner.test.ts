import { describe, expect, it, vi } from "vitest";

import {
  createInThreadBodyTaskRunner,
  createWorkerBodyTaskRunner,
  type BodyTaskRequest,
  type BodyTaskResponse,
} from "./body-task-runner";
import { createBodyTaskHandler, type BodyTaskInput, type BodyTaskName } from "./body-tasks";

/**
 * A stand-in for the body worker that runs the real handler and answers asynchronously, like a
 * worker does; `failNext` makes it crash instead.
 */
class FakeBodyWorker extends EventTarget {
  readonly handle = createBodyTaskHandler();
  failNext = false;
  terminated = false;

  postMessage(request: BodyTaskRequest): void {
    queueMicrotask(() => {
      if (this.failNext) {
        this.dispatchEvent(Object.assign(new Event("error"), { message: "worker crashed" }));
        return;
      }
      let response: BodyTaskResponse;
      try {
        const output = this.handle(request.name, request.input as BodyTaskInput<BodyTaskName>);
        response = { id: request.id, ok: true, output };
      } catch (error) {
        response = { id: request.id, ok: false, message: (error as Error).message };
      }
      this.dispatchEvent(new MessageEvent("message", { data: response }));
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe("createInThreadBodyTaskRunner", () => {
  it("resolves with the task's output and rejects when it throws", async () => {
    const runner = createInThreadBodyTaskRunner();
    await expect(runner.run("prettyPrint", { format: "json", text: "[]" })).resolves.toBe("[]");
    await expect(runner.run("copyJsonValue", { documentId: "x", path: [] })).rejects.toThrow(
      /not open/,
    );
  });
});

describe("createWorkerBodyTaskRunner", () => {
  it("creates the worker on the first task and matches answers to tasks", async () => {
    const workers: FakeBodyWorker[] = [];
    const createWorker = vi.fn(() => {
      const worker = new FakeBodyWorker();
      workers.push(worker);
      return worker as unknown as Worker;
    });
    const runner = createWorkerBodyTaskRunner(createWorker);
    expect(createWorker).not.toHaveBeenCalled();

    const [pretty, opened] = await Promise.all([
      runner.run("prettyPrint", { format: "json", text: "[1]" }),
      runner.run("openJsonDocument", { documentId: "d", text: '{"a":true}' }),
    ]);
    expect(pretty).toBe("[\n  1\n]");
    expect(opened).toMatchObject({ kind: "object", childCount: 1 });
    await expect(runner.run("copyJsonValue", { documentId: "d", path: ["a"] })).resolves.toBe(
      "true",
    );
    expect(createWorker).toHaveBeenCalledTimes(1);
  });

  it("rejects a task the worker reports as failed", async () => {
    const runner = createWorkerBodyTaskRunner(() => new FakeBodyWorker() as unknown as Worker);
    await expect(runner.run("listJsonChildren", { documentId: "x", path: [] })).rejects.toThrow(
      /not open/,
    );
  });

  it("rejects pending tasks when the worker crashes, and starts a new one next time", async () => {
    const workers: FakeBodyWorker[] = [];
    const runner = createWorkerBodyTaskRunner(() => {
      const worker = new FakeBodyWorker();
      workers.push(worker);
      return worker as unknown as Worker;
    });
    await runner.run("prettyPrint", { format: "json", text: "1" });
    const first = workers[0];
    if (!first) throw new Error("No worker was created");
    first.failNext = true;

    await expect(runner.run("prettyPrint", { format: "json", text: "2" })).rejects.toThrow(
      "worker crashed",
    );
    expect(first.terminated).toBe(true);
    await expect(runner.run("prettyPrint", { format: "json", text: "3" })).resolves.toBe("3");
    expect(workers).toHaveLength(2);
  });
});
