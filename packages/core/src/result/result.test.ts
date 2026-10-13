import { describe, expect, it } from "vitest";

import { assertNever } from "./assert-never";
import { err, ok, type Result } from "./result";

function parsePort(value: string): Result<number, "not_a_number" | "out_of_range"> {
  const port = Number(value);
  if (!Number.isInteger(port)) return err("not_a_number");
  if (port < 1 || port > 65_535) return err("out_of_range");
  return ok(port);
}

describe("Result", () => {
  it("carries a value on success and narrows on ok", () => {
    const result = parsePort("8080");

    expect(result).toEqual({ ok: true, value: 8080 });
    if (result.ok) expect(result.value + 1).toBe(8081);
  });

  it("carries a typed error on failure", () => {
    expect(parsePort("http")).toEqual({ ok: false, error: "not_a_number" });
    expect(parsePort("70000")).toEqual({ ok: false, error: "out_of_range" });
  });
});

describe("assertNever", () => {
  it("throws with the unexpected value and its context", () => {
    expect(() => assertNever("sepia" as never, "theme")).toThrow('Unexpected theme: "sepia"');
  });
});
