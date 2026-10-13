import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDebouncedTask } from "./debounced-task";

const DELAY = 100;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createDebouncedTask", () => {
  it("runs once after calls stop", async () => {
    const run = vi.fn(() => Promise.resolve());
    const task = createDebouncedTask(run, DELAY);

    task.schedule();
    await vi.advanceTimersByTimeAsync(DELAY / 2);
    task.schedule();
    await vi.advanceTimersByTimeAsync(DELAY / 2);
    expect(run).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DELAY);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs a waiting task at once on flush, and does nothing when nothing waits", async () => {
    const run = vi.fn(() => Promise.resolve());
    const task = createDebouncedTask(run, DELAY);

    await task.flush();
    expect(run).not.toHaveBeenCalled();

    task.schedule();
    await task.flush();
    expect(run).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(DELAY);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("drops a waiting run on cancel", async () => {
    const run = vi.fn(() => Promise.resolve());
    const task = createDebouncedTask(run, DELAY);

    task.schedule();
    task.cancel();
    task.cancel();
    await vi.advanceTimersByTimeAsync(DELAY);

    expect(run).not.toHaveBeenCalled();
  });

  it("reports failures and keeps working", async () => {
    const onError = vi.fn();
    const run = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("QuotaExceededError"))
      .mockResolvedValue(undefined);
    const task = createDebouncedTask(run, DELAY, onError);

    task.schedule();
    await task.flush();
    task.schedule();
    await task.flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("never overlaps runs", async () => {
    const events: string[] = [];
    let release: () => void = () => undefined;
    const run = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            events.push("first started");
            release = () => {
              events.push("first done");
              resolve();
            };
          }),
      )
      .mockImplementation(() => {
        events.push("second started");
        return Promise.resolve();
      });
    const task = createDebouncedTask(run, DELAY);

    task.schedule();
    const first = task.flush();
    task.schedule();
    const second = task.flush();
    await vi.advanceTimersByTimeAsync(0);
    release();
    await Promise.all([first, second]);

    expect(events).toEqual(["first started", "first done", "second started"]);
  });
});
