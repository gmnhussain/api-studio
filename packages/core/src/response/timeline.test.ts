import { describe, expect, it } from "vitest";

import { getTimelineSegments } from "./timeline";

const startedAt = "2026-10-14T10:00:00.000Z";

describe("getTimelineSegments", () => {
  it("lays waiting and download end to end", () => {
    expect(
      getTimelineSegments({
        startedAt,
        timeToFirstByteMilliseconds: 120,
        downloadMilliseconds: 30,
        totalMilliseconds: 150,
      }),
    ).toEqual([
      { phase: "waiting", offsetMilliseconds: 0, durationMilliseconds: 120 },
      { phase: "download", offsetMilliseconds: 120, durationMilliseconds: 30 },
    ]);
  });

  it("leaves out phases the transport could not measure", () => {
    expect(
      getTimelineSegments({
        startedAt,
        timeToFirstByteMilliseconds: null,
        downloadMilliseconds: null,
        totalMilliseconds: 80,
      }),
    ).toEqual([]);
    expect(
      getTimelineSegments({
        startedAt,
        timeToFirstByteMilliseconds: null,
        downloadMilliseconds: 20,
        totalMilliseconds: 80,
      }),
    ).toEqual([{ phase: "download", offsetMilliseconds: 60, durationMilliseconds: 20 }]);
  });
});
