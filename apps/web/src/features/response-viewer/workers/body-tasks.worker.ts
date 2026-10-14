/**
 * The body worker: parses and formats large response bodies off the main thread, and keeps
 * parsed JSON documents for the tree (performance.md#strategies). It runs the same handler the
 * page uses for small bodies.
 */
import type { BodyTaskRequest, BodyTaskResponse } from "../lib/body-task-runner";
import { createBodyTaskHandler, type BodyTaskName, type BodyTaskInput } from "../lib/body-tasks";

const handle = createBodyTaskHandler();

function respond(response: BodyTaskResponse): void {
  postMessage(response);
}

addEventListener("message", (event: MessageEvent<BodyTaskRequest>) => {
  const { id, name, input } = event.data;
  try {
    // The page sends each task with its own input type (BodyTaskRunner.run).
    const output = handle(name, input as BodyTaskInput<BodyTaskName>);
    respond({ id, ok: true, output });
  } catch (error) {
    respond({ id, ok: false, message: error instanceof Error ? error.message : String(error) });
  }
});
