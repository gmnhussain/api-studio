import { describe, expect, it } from "vitest";

import { tokenizeJsonLine } from "./json-highlight";

describe("tokenizeJsonLine", () => {
  it("colours keys, strings, numbers and literals, keeping everything else", () => {
    expect(
      tokenizeJsonLine('  "id": -1.5e3, "ok": true, "name": "Ada \\"A\\"", "x": null'),
    ).toEqual([
      { kind: "plain", text: "  " },
      { kind: "key", text: '"id"' },
      { kind: "plain", text: ":" },
      { kind: "plain", text: " " },
      { kind: "number", text: "-1.5e3" },
      { kind: "plain", text: ", " },
      { kind: "key", text: '"ok"' },
      { kind: "plain", text: ":" },
      { kind: "plain", text: " " },
      { kind: "keyword", text: "true" },
      { kind: "plain", text: ", " },
      { kind: "key", text: '"name"' },
      { kind: "plain", text: ":" },
      { kind: "plain", text: " " },
      { kind: "string", text: '"Ada \\"A\\""' },
      { kind: "plain", text: ", " },
      { kind: "key", text: '"x"' },
      { kind: "plain", text: ":" },
      { kind: "plain", text: " " },
      { kind: "keyword", text: "null" },
    ]);
  });

  it("joins back into the line, including a string cut at the row's end", () => {
    const line = '{"text": "a long value that was cut';
    const tokens = tokenizeJsonLine(line);
    expect(tokens.map((token) => token.text).join("")).toBe(line);
    expect(tokens.at(-1)).toEqual({ kind: "string", text: '"a long value that was cut' });
  });
});
