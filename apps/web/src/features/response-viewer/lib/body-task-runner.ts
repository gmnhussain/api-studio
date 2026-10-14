import {
  createBodyTaskHandler,
  type BodyTaskInput,
  type BodyTaskName,
  type BodyTaskOutput,
} from "./body-tasks";

/** Runs body tasks somewhere: in the page or in a worker. */
export type BodyTaskRunner = {
  run: <Name extends BodyTaskName>(
    name: Name,
    input: BodyTaskInput<Name>,
  ) => Promise<BodyTaskOutput<Name>>;
};

/** A task sent to the body worker. */
export type BodyTaskRequest = { id: number; name: BodyTaskName; input: unknown };

/** The worker's answer to one {@link BodyTaskRequest}. */
export type BodyTaskResponse =
  { id: number; ok: true; output: unknown } | { id: number; ok: false; message: string };

/** Runs tasks in the page; for bodies small enough that a worker would only add latency. */
export function createInThreadBodyTaskRunner(): BodyTaskRunner {
  const handle = createBodyTaskHandler();
  return {
    run: (name, input) => {
      try {
        return Promise.resolve(handle(name, input));
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
}

type PendingTask = { resolve: (output: unknown) => void; reject: (error: Error) => void };

/**
 * Runs tasks in a Web Worker, created on the first task. Tasks run one after another in the
 * worker, so the page stays responsive while a large body is parsed or formatted. If the worker
 * fails, its pending tasks are rejected and the next task starts a new one (whose documents are
 * gone, so callers reopen them).
 */
export function createWorkerBodyTaskRunner(createWorker: () => Worker): BodyTaskRunner {
  let worker: Worker | null = null;
  let nextId = 0;
  const pending = new Map<number, PendingTask>();

  const failAll = (message: string) => {
    for (const task of pending.values()) task.reject(new Error(message));
    pending.clear();
    worker?.terminate();
    worker = null;
  };

  const ensureWorker = (): Worker => {
    if (worker) return worker;
    const created = createWorker();
    created.addEventListener("message", (event: MessageEvent<BodyTaskResponse>) => {
      const response = event.data;
      const task = pending.get(response.id);
      if (!task) return;
      pending.delete(response.id);
      if (response.ok) task.resolve(response.output);
      else task.reject(new Error(response.message));
    });
    created.addEventListener("error", (event) => {
      failAll(event.message || "The body worker failed");
    });
    worker = created;
    return created;
  };

  return {
    run: <Name extends BodyTaskName>(name: Name, input: BodyTaskInput<Name>) =>
      new Promise<BodyTaskOutput<Name>>((resolve, reject) => {
        nextId += 1;
        const id = nextId;
        // The worker answers with the output of the task it was sent (BodyTasks).
        pending.set(id, { resolve: resolve as (output: unknown) => void, reject });
        const request: BodyTaskRequest = { id, name, input };
        ensureWorker().postMessage(request);
      }),
  };
}
