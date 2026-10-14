import { describe, expect, it } from "vitest";

import { matchesTextFilter } from "./text-filter";

describe("matchesTextFilter", () => {
  it("matches any field, ignoring case and spaces; an empty filter matches all", () => {
    expect(matchesTextFilter("  CONTENT ", ["content-type", "x"])).toBe(true);
    expect(matchesTextFilter("json", ["content-type", "application/json"])).toBe(true);
    expect(matchesTextFilter("xml", ["content-type", "application/json"])).toBe(false);
    expect(matchesTextFilter("", [])).toBe(true);
  });
});
