import { WORKER_BODY_THRESHOLD } from "./body-size-limits";
import {
  createInThreadBodyTaskRunner,
  createWorkerBodyTaskRunner,
  type BodyTaskRunner,
} from "./body-task-runner";

let inThreadRunner: BodyTaskRunner | undefined;
let workerRunner: BodyTaskRunner | undefined;

/**
 * The runner for a body of this many characters: the shared worker for large bodies when the
 * browser has workers, the page otherwise. Documents opened through a runner must be read
 * through the same one.
 */
export function getBodyTaskRunner(length: number): BodyTaskRunner {
  if (length > WORKER_BODY_THRESHOLD && typeof Worker !== "undefined") {
    workerRunner ??= createWorkerBodyTaskRunner(
      () =>
        new Worker(new URL("../workers/body-tasks.worker.ts", import.meta.url), {
          type: "module",
          name: "response-body",
        }),
    );
    return workerRunner;
  }
  inThreadRunner ??= createInThreadBodyTaskRunner();
  return inThreadRunner;
}
