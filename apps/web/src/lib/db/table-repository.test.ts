// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createWorkspace,
  environmentSchema,
  createEnvironment,
  sortKeyBetween,
  workspaceSchema,
} from "@api-studio/core";

import { createChangeFeed, type DataChange } from "./change-feed";
import { createDatabase, type ApiStudioDatabase } from "./database";
import { createTableRepository, type InvalidRecord } from "./table-repository";

const openDatabases: ApiStudioDatabase[] = [];

function openTestDatabase(): ApiStudioDatabase {
  const database = createDatabase(`test-${crypto.randomUUID()}`);
  openDatabases.push(database);
  return database;
}

afterEach(async () => {
  for (const database of openDatabases.splice(0)) await database.delete();
});

describe("createTableRepository", () => {
  it("stores and reads records", async () => {
    const database = openTestDatabase();
    const repository = createTableRepository({
      tableName: "workspaces",
      table: database.workspaces,
      schema: workspaceSchema,
    });
    const workspace = createWorkspace({ name: "Acme" });

    await repository.put(workspace);

    expect(await repository.get(workspace.id)).toEqual(workspace);
    expect(await repository.getAll()).toEqual([workspace]);
  });

  it("finds records by an indexed field", async () => {
    const database = openTestDatabase();
    const repository = createTableRepository({
      tableName: "environments",
      table: database.environments,
      schema: environmentSchema,
    });
    const acme = createWorkspace({ name: "Acme" });
    const other = createWorkspace({ name: "Other" });
    const sortKey = sortKeyBetween(null, null);
    const local = createEnvironment({ workspaceId: acme.id, name: "Local", sortKey });

    await repository.bulkPut([
      local,
      createEnvironment({ workspaceId: other.id, name: "Prod", sortKey }),
    ]);

    expect(await repository.findBy("workspaceId", acme.id)).toEqual([local]);
  });

  it("skips and reports records that fail validation", async () => {
    const database = openTestDatabase();
    const onInvalidRecord = vi.fn<(record: InvalidRecord) => void>();
    const repository = createTableRepository({
      tableName: "workspaces",
      table: database.workspaces,
      schema: workspaceSchema,
      onInvalidRecord,
    });
    const valid = createWorkspace({ name: "Acme" });
    await repository.put(valid);
    // Simulates data written by an older version or a bug: no name.
    await database.workspaces.put({ ...createWorkspace({ name: "x" }), name: "" });

    const all = await repository.getAll();

    expect(all).toEqual([valid]);
    expect(onInvalidRecord).toHaveBeenCalledOnce();
    expect(onInvalidRecord.mock.calls[0]?.[0]).toMatchObject({ table: "workspaces" });
  });

  it("deletes one or many records", async () => {
    const database = openTestDatabase();
    const repository = createTableRepository({
      tableName: "workspaces",
      table: database.workspaces,
      schema: workspaceSchema,
    });
    const [first, second, third] = ["a", "b", "c"].map((name) => createWorkspace({ name }));
    if (!first || !second || !third) throw new Error("expected three workspaces");
    await repository.bulkPut([first, second, third]);

    await repository.delete(first.id);
    await repository.bulkDelete([second.id]);

    expect(await repository.getAll()).toEqual([third]);
    expect(await repository.get(first.id)).toBeUndefined();
  });

  it("tells other tabs which records changed", async () => {
    const database = openTestDatabase();
    const channelName = `changes-${crypto.randomUUID()}`;
    const thisTab = createChangeFeed(channelName);
    const otherTab = createChangeFeed(channelName);
    const received = new Promise<DataChange>((resolve) => {
      otherTab.subscribe(resolve);
    });
    const ownChanges = vi.fn();
    thisTab.subscribe(ownChanges);
    const repository = createTableRepository({
      tableName: "workspaces",
      table: database.workspaces,
      schema: workspaceSchema,
      changeFeed: thisTab,
    });
    const workspace = createWorkspace({ name: "Acme" });

    await repository.put(workspace);

    expect(await received).toEqual({ table: "workspaces", ids: [workspace.id] });
    expect(ownChanges).not.toHaveBeenCalled();
    thisTab.close();
    otherTab.close();
  });
});
