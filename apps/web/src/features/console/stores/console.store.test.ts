import { beforeEach, describe, expect, it } from "vitest";

import { CONSOLE_ENTRY_LIMIT } from "../console.constants";
import { getInitialConsoleState, useConsoleStore } from "./console.store";

const store = () => useConsoleStore.getState();
const message = (text: string) =>
  ({ level: "info", at: "2026-10-14T09:30:00.000Z", kind: "message", message: text }) as const;

beforeEach(() => {
  useConsoleStore.setState(getInitialConsoleState());
});

describe("console store", () => {
  it("appends entries with ids, oldest first", () => {
    store().append(message("first"));
    store().append(message("second"));

    const [first, second] = store().entries;
    expect([
      first?.kind === "message" && first.message,
      second?.kind === "message" && second.message,
    ]).toEqual(["first", "second"]);
    expect(first?.id).not.toBe(second?.id);
  });

  it("keeps only the newest entries past the limit", () => {
    for (let index = 0; index < CONSOLE_ENTRY_LIMIT + 3; index += 1) {
      store().append(message(String(index)));
    }

    expect(store().entries).toHaveLength(CONSOLE_ENTRY_LIMIT);
    const [oldest] = store().entries;
    expect(oldest?.kind === "message" && oldest.message).toBe("3");
  });

  it("clears entries but keeps the level filter", () => {
    store().append(message("x"));
    store().setMinimumLevel("error");

    store().clear();

    expect(store()).toMatchObject({ entries: [], minimumLevel: "error" });
  });
});
