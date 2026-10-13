import { describe, expect, it } from "vitest";

import { resolvedRequestSchema } from "./resolved-request.schema";

describe("resolvedRequestSchema", () => {
  it("accepts each body kind", () => {
    for (const body of [
      { kind: "none" },
      { kind: "text", text: "{}" },
      { kind: "form_data", parts: [{ name: "a", value: "1" }] },
    ]) {
      expect(
        resolvedRequestSchema.safeParse({
          method: "POST",
          url: "https://x.dev",
          headers: [{ name: "Accept", value: "*/*" }],
          body,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects unknown methods and body kinds", () => {
    const valid = { method: "GET", url: "https://x.dev", headers: [], body: { kind: "none" } };

    expect(resolvedRequestSchema.safeParse({ ...valid, method: "TRACE" }).success).toBe(false);
    expect(resolvedRequestSchema.safeParse({ ...valid, body: { kind: "stream" } }).success).toBe(
      false,
    );
  });
});
