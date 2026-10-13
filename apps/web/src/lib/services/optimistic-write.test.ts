import { describe, expect, it, vi } from "vitest";

import { runOptimisticWrite } from "./optimistic-write";

describe("runOptimisticWrite", () => {
  it("applies, persists and keeps the change", async () => {
    const steps: string[] = [];

    const result = await runOptimisticWrite({
      apply: () => steps.push("apply"),
      persist: () => {
        steps.push("persist");
        return Promise.resolve();
      },
      rollback: () => steps.push("rollback"),
    });

    expect(result).toEqual({ ok: true, value: null });
    expect(steps).toEqual(["apply", "persist"]);
  });

  it("rolls back and reports a storage error when persisting fails", async () => {
    const rollback = vi.fn();

    const result = await runOptimisticWrite({
      apply: vi.fn(),
      persist: () => Promise.reject(new Error("QuotaExceededError")),
      rollback,
    });

    expect(result).toEqual({ ok: false, error: "storage" });
    expect(rollback).toHaveBeenCalledOnce();
  });
});
