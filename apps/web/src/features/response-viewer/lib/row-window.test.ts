import { describe, expect, it } from "vitest";

import { getRowWindow } from "./row-window";

const base = { viewportHeight: 100, rowHeight: 20, overscan: 0 };

describe("getRowWindow", () => {
  it("shows the rows under a scroll position when nothing is scaled", () => {
    expect(getRowWindow({ ...base, scrollTop: 0, rowCount: 100 })).toEqual({
      scrollHeight: 2000,
      first: 0,
      end: 5,
      offset: 0,
    });
    expect(getRowWindow({ ...base, scrollTop: 210, rowCount: 100 })).toEqual({
      scrollHeight: 2000,
      first: 10,
      end: 16,
      offset: 200,
    });
  });

  it("adds overscan without passing either end", () => {
    const window = getRowWindow({ ...base, overscan: 3, scrollTop: 0, rowCount: 6 });
    expect(window).toMatchObject({ first: 0, end: 6, scrollHeight: 120 });
  });

  it("scales scrolling past the height cap, reaching the last row at the bottom", () => {
    const rowCount = 1_000_000;
    const maxScrollHeight = 10_000;
    const top = getRowWindow({ ...base, scrollTop: 0, rowCount, maxScrollHeight });
    expect(top).toMatchObject({ scrollHeight: 10_000, first: 0 });

    const bottom = getRowWindow({ ...base, scrollTop: 9900, rowCount, maxScrollHeight });
    expect(bottom.end).toBe(rowCount);
    // The last row ends exactly at the bottom of the viewport.
    expect(bottom.offset + (bottom.end - bottom.first) * base.rowHeight).toBe(10_000);

    const middle = getRowWindow({ ...base, scrollTop: 4950, rowCount, maxScrollHeight });
    expect(middle.first).toBeGreaterThan(499_000);
    expect(middle.first).toBeLessThan(501_000);
  });

  it("clamps scroll positions outside the range, as elastic scrolling reports", () => {
    expect(getRowWindow({ ...base, scrollTop: -50, rowCount: 100 })).toMatchObject({ first: 0 });
    expect(getRowWindow({ ...base, scrollTop: 99_999, rowCount: 100 })).toMatchObject({
      end: 100,
    });
  });

  it("renders nothing for no rows", () => {
    expect(getRowWindow({ ...base, scrollTop: 0, rowCount: 0 })).toEqual({
      scrollHeight: 0,
      first: 0,
      end: 0,
      offset: 0,
    });
  });
});
