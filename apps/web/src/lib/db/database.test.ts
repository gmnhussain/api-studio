// @vitest-environment node
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createDatabase, DATABASE_VERSIONS, getDatabase } from "./database";

describe("database", () => {
  it("declares versions in increasing order", () => {
    const versions = DATABASE_VERSIONS.map((entry) => entry.version);

    expect([...versions].sort((left, right) => left - right)).toEqual(versions);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("opens with every table of the latest version", async () => {
    const database = createDatabase(`test-${crypto.randomUUID()}`);

    await database.open();

    expect(database.tables.map((table) => table.name).sort()).toEqual(
      ["collectionItems", "collections", "environments", "workspaces"].sort(),
    );
    expect(database.verno).toBe(DATABASE_VERSIONS.at(-1)?.version);
    await database.delete();
  });

  it("refuses to open on the server", () => {
    expect(() => getDatabase()).toThrow("only available in the browser");
  });
});
