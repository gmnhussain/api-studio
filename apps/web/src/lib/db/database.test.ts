// @vitest-environment node
import "fake-indexeddb/auto";

import { Dexie } from "dexie";
import { describe, expect, it } from "vitest";

import { createCollection, createWorkspace, sortKeyBetween } from "@api-studio/core";

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
      [
        "collectionItems",
        "collections",
        "cookieJars",
        "drafts",
        "environments",
        "tabLayouts",
        "workspaces",
      ].sort(),
    );
    expect(database.verno).toBe(DATABASE_VERSIONS.at(-1)?.version);
    await database.delete();
  });

  it("keeps data written by version 1 when it upgrades", async () => {
    const name = `test-${crypto.randomUUID()}`;
    const [firstVersion] = DATABASE_VERSIONS;
    const workspace = createWorkspace({ name: "Acme" });
    const collection = createCollection({
      workspaceId: workspace.id,
      name: "API",
      sortKey: sortKeyBetween(null, null),
    });
    const legacy = new Dexie(name);
    legacy.version(firstVersion.version).stores(firstVersion.stores);
    await legacy.table("workspaces").put(workspace);
    await legacy.table("collections").put(collection);
    legacy.close();

    const database = createDatabase(name);
    await database.open();

    expect(await database.workspaces.get(workspace.id)).toEqual(workspace);
    expect(await database.collections.where("workspaceId").equals(workspace.id).count()).toBe(1);
    expect(await database.drafts.count()).toBe(0);
    await database.delete();
  });

  it("refuses to open on the server", () => {
    expect(() => getDatabase()).toThrow("only available in the browser");
  });
});
