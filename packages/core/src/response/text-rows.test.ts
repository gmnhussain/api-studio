import { describe, expect, it } from "vitest";

import { getTextRow, indexTextRows } from "./text-rows";

function rowsOf(text: string, maxRowLength?: number): string[] {
  const rows = indexTextRows(text, maxRowLength);
  return Array.from({ length: rows.count }, (_value, index) => getTextRow(rows, index));
}

describe("indexTextRows", () => {
  it("makes a row of every line, without the line breaks", () => {
    expect(rowsOf("a\nbb\r\nccc")).toEqual(["a", "bb", "ccc"]);
    expect(rowsOf("one")).toEqual(["one"]);
    expect(rowsOf("")).toEqual([""]);
    expect(rowsOf("end\n")).toEqual(["end", ""]);
  });

  it("cuts long lines into rows of the maximum length", () => {
    expect(rowsOf("abcdefg\nhi", 3)).toEqual(["abc", "def", "g", "hi"]);
    expect(rowsOf("abcdef", 3)).toEqual(["abc", "def"]);
  });

  it("grows past its starting capacity", () => {
    const rows = indexTextRows("x\n".repeat(5000));
    expect(rows.count).toBe(5001);
    expect(getTextRow(rows, 4999)).toBe("x");
  });
});
