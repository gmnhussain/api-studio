import { setTimeout as delay } from "node:timers/promises";

import { describe, expect, it } from "vitest";

import { createExecutionSignal, isTimeoutReason } from "./execution-signal";

describe("createExecutionSignal", () => {
  it("aborts with a timeout reason when the timeout elapses", async () => {
    const signal = createExecutionSignal({ timeoutMilliseconds: 10 });

    await delay(50);

    expect(signal.aborted).toBe(true);
    expect(isTimeoutReason(signal.reason)).toBe(true);
  });

  it("aborts immediately with the cancel reason when the caller cancels", () => {
    const cancelController = new AbortController();
    const signal = createExecutionSignal({
      cancelSignal: cancelController.signal,
      timeoutMilliseconds: 60_000,
    });

    cancelController.abort();

    expect(signal.aborted).toBe(true);
    expect(isTimeoutReason(signal.reason)).toBe(false);
  });

  it("is already aborted when the cancel signal was aborted before", () => {
    const signal = createExecutionSignal({
      cancelSignal: AbortSignal.abort(),
      timeoutMilliseconds: 60_000,
    });

    expect(signal.aborted).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects a timeout of %s",
    (timeoutMilliseconds) => {
      expect(() => createExecutionSignal({ timeoutMilliseconds })).toThrow(RangeError);
    },
  );
});

describe("isTimeoutReason", () => {
  it.each([new DOMException("aborted", "AbortError"), new Error("TimeoutError"), undefined])(
    "is false for %s",
    (reason) => {
      expect(isTimeoutReason(reason)).toBe(false);
    },
  );
});
