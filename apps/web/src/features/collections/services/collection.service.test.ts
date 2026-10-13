// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  childrenOf,
  createWorkspace,
  type Collection,
  type CollectionItem,
} from "@api-studio/core";

import { createChangeFeed, type ChangeFeed } from "@/lib/db/change-feed";
import { createDatabase, type ApiStudioDatabase } from "@/lib/db/database";

import { createCollectionService } from "./collection.service";
import { createCollectionRepository } from "../repositories/collection.repository";
import { getInitialCollectionState, useCollectionStore } from "../stores/collection.store";

let database: ApiStudioDatabase;
const feeds: ChangeFeed[] = [];
const workspace = createWorkspace({ name: "Acme" });

function setUp(changeFeed?: ChangeFeed) {
  let tick = 0;
  const repository = createCollectionRepository(database, { changeFeed });
  const service = createCollectionService({
    repository,
    store: useCollectionStore,
    changeFeed,
    now: () => new Date(Date.UTC(2026, 9, 14, 9, 0, tick++)).toISOString(),
  });
  return { repository, service };
}

function expectOk<Value>(result: { ok: true; value: Value } | { ok: false; error: string }): Value {
  if (!result.ok) throw new Error(`expected success, got ${result.error}`);
  return result.value;
}

function rootNames(collection: Collection): string[] {
  const items = Object.values(useCollectionStore.getState().items);
  return childrenOf(items, collection.id, null).map((item) => item.name);
}

beforeEach(() => {
  database = createDatabase(`test-${crypto.randomUUID()}`);
  useCollectionStore.setState(getInitialCollectionState());
});

afterEach(async () => {
  for (const feed of feeds.splice(0)) feed.close();
  await database.delete();
});

describe("collection service", () => {
  it("creates collections and items that survive a reload", async () => {
    const { service } = setUp();
    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("Users API"));
    const folder = expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Auth",
        type: "folder",
      }),
    );
    expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: folder.id,
        name: "Login",
        type: "request",
      }),
    );

    useCollectionStore.setState(getInitialCollectionState());
    await setUp().service.loadCollections(workspace.id);

    const items = Object.values(useCollectionStore.getState().items);
    expect(
      Object.values(useCollectionStore.getState().collections).map((entry) => entry.name),
    ).toEqual(["Users API"]);
    expect(childrenOf(items, collection.id, folder.id).map((item) => item.name)).toEqual(["Login"]);
  });

  it("refuses items without a workspace, a valid name or a folder parent", async () => {
    const { service } = setUp();
    expect(await service.createCollection("API")).toEqual({ ok: false, error: "no_workspace" });

    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("API"));
    const request = expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Ping",
        type: "request",
      }),
    );

    expect(await service.createCollection("  ")).toEqual({ ok: false, error: "invalid_name" });
    expect(
      await service.createItem({
        collectionId: collection.id,
        parentId: request.id,
        name: "Child",
        type: "folder",
      }),
    ).toEqual({ ok: false, error: "invalid_move" });
  });

  it("moves items between folders and positions, and refuses moves into themselves", async () => {
    const { service } = setUp();
    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("API"));
    const add = async (
      name: string,
      type: "folder" | "request",
      parentId: CollectionItem["parentId"] = null,
    ) => expectOk(await service.createItem({ collectionId: collection.id, parentId, name, type }));
    const auth = await add("Auth", "folder");
    await add("Health", "request");
    const ping = await add("Ping", "request");
    const nested = await add("Nested", "folder", auth.id);

    expectOk(await service.moveItem(ping.id, null, 0));
    expect(rootNames(collection)).toEqual(["Ping", "Auth", "Health"]);

    expectOk(await service.moveItem(ping.id, auth.id, 0));
    expect(rootNames(collection)).toEqual(["Auth", "Health"]);

    expect(await service.moveItem(auth.id, nested.id, 0)).toEqual({
      ok: false,
      error: "invalid_move",
    });
  });

  it("duplicates a folder right after the original, with its contents", async () => {
    const { service } = setUp();
    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("API"));
    const auth = expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Auth",
        type: "folder",
      }),
    );
    expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Health",
        type: "request",
      }),
    );
    expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: auth.id,
        name: "Login",
        type: "request",
      }),
    );

    const copy = expectOk(await service.duplicateItem(auth.id, "Auth copy"));

    expect(rootNames(collection)).toEqual(["Auth", "Auth copy", "Health"]);
    const items = Object.values(useCollectionStore.getState().items);
    expect(childrenOf(items, collection.id, copy.id).map((item) => item.name)).toEqual(["Login"]);
  });

  it("deletes an item with its descendants, and a collection with its items", async () => {
    const { service, repository } = setUp();
    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("API"));
    const auth = expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Auth",
        type: "folder",
      }),
    );
    expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: auth.id,
        name: "Login",
        type: "request",
      }),
    );
    expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Health",
        type: "request",
      }),
    );

    expectOk(await service.deleteItem(auth.id));
    expect(rootNames(collection)).toEqual(["Health"]);
    expect(await repository.items.getAll()).toHaveLength(1);

    expectOk(await service.deleteCollection(collection.id));
    expect(await repository.collections.getAll()).toEqual([]);
    expect(await repository.items.getAll()).toEqual([]);
  });

  it("rolls back a rename when the write fails", async () => {
    const { service, repository } = setUp();
    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("API"));
    const ping = expectOk(
      await service.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "Ping",
        type: "request",
      }),
    );
    vi.spyOn(repository.items, "bulkPut").mockRejectedValueOnce(new Error("QuotaExceededError"));

    expect(await service.renameItem(ping.id, "Pong")).toEqual({ ok: false, error: "storage" });
    expect(useCollectionStore.getState().items[ping.id]?.name).toBe("Ping");
  });

  it("picks up items created in another tab", async () => {
    const channelName = `changes-${crypto.randomUUID()}`;
    const otherFeed = createChangeFeed(channelName);
    const thisFeed = createChangeFeed(channelName);
    feeds.push(otherFeed, thisFeed);
    const { service } = setUp(thisFeed);
    await service.loadCollections(workspace.id);
    const collection = expectOk(await service.createCollection("API"));
    const stopSync = service.syncWithOtherTabs();

    const otherTab = createCollectionService({
      repository: createCollectionRepository(database, { changeFeed: otherFeed }),
      store: { getState: () => ({ ...useCollectionStore.getState(), upsertItems: vi.fn() }) },
    });
    const created = expectOk(
      await otherTab.createItem({
        collectionId: collection.id,
        parentId: null,
        name: "From another tab",
        type: "request",
      }),
    );

    await vi.waitFor(() => {
      expect(useCollectionStore.getState().items[created.id]?.name).toBe("From another tab");
    });
    stopSync();
  });
});
