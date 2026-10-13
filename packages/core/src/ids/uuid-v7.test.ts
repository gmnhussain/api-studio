import { describe, expect, it } from "vitest";

import { createUuidV7 } from "./uuid-v7";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("createUuidV7", () => {
  it("produces RFC 9562 version 7 ids", () => {
    for (let index = 0; index < 100; index += 1) {
      expect(createUuidV7()).toMatch(UUID_V7_PATTERN);
    }
  });

  it("encodes the timestamp in the first 48 bits", () => {
    const id = createUuidV7({
      now: () => 0x0189_4a2b_3c4d,
      fillRandom: (bytes) => bytes.fill(0),
    });

    expect(id).toBe("01894a2b-3c4d-7000-8000-000000000000");
  });

  it("sorts by creation time", () => {
    const fixedRandom = { fillRandom: (bytes: Uint8Array<ArrayBuffer>) => bytes.fill(0xff) };
    const earlier = createUuidV7({ now: () => 1_000, ...fixedRandom });
    const later = createUuidV7({ now: () => 1_001, ...fixedRandom });

    expect(earlier < later).toBe(true);
  });

  it("is unique across many calls", () => {
    const ids = new Set(Array.from({ length: 10_000 }, () => createUuidV7()));

    expect(ids.size).toBe(10_000);
  });
});
