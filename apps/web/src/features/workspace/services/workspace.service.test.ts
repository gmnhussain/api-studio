// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCollection,
  createEditorTab,
  createEnvironment,
  createHttpRequestDefinition,
  createId,
  createRequestItem,
  createTabLayout,
  createWorkspace,
  sortKeyBetween,
  type Workspace,
} from "@api-studio/core";

import type { KeyValueStorage } from "@/lib/cookies/browser-cookie-storage";
import { createChangeFeed, type ChangeFeed } from "@/lib/db/change-feed";
import { createDatabase, type ApiStudioDatabase } from "@/lib/db/database";

import { createWorkspaceRepository } from "../repositories/workspace.repository";
import { getInitialWorkspaceState, useWorkspaceStore } from "../stores/workspace.store";
import { LAST_WORKSPACE_COOKIE } from "../workspace.constants";
import { createWorkspaceService } from "./workspace.service";

/** An in-memory stand-in for the last-workspace cookie. */
function createMemoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

let database: ApiStudioDatabase;
const feeds: ChangeFeed[] = [];

function setUp({ changeFeed }: { changeFeed?: ChangeFeed } = {}) {
  const repository = createWorkspaceRepository(database, { changeFeed });
  const storage = createMemoryStorage();
  let tick = 0;
  const service = createWorkspaceService({
    repository,
    store: useWorkspaceStore,
    storage,
    changeFeed,
    // A clock that moves one second per call, so creation order is unambiguous.
    now: () => new Date(Date.UTC(2026, 9, 14, 9, 0, tick++)).toISOString(),
  });
  return { repository, service, storage };
}

beforeEach(() => {
  database = createDatabase(`test-${crypto.randomUUID()}`);
  useWorkspaceStore.setState(getInitialWorkspaceState());
});

afterEach(async () => {
  for (const feed of feeds.splice(0)) feed.close();
  await database.delete();
});

describe("workspace service", () => {
  it("creates the first workspace on first run", async () => {
    const { service, repository } = setUp();

    const result = await service.loadWorkspaces("My workspace");

    expect(result.ok).toBe(true);
    expect(useWorkspaceStore.getState().status).toBe("ready");
    expect(useWorkspaceStore.getState().workspaces.map((workspace) => workspace.name)).toEqual([
      "My workspace",
    ]);
    expect(await repository.getAll()).toHaveLength(1);
  });

  it("loads existing workspaces once, even when asked twice at the same time", async () => {
    const { service, repository } = setUp();
    await repository.put(createWorkspace({ name: "Acme" }));
    const getAll = vi.spyOn(repository, "getAll");

    await Promise.all([service.loadWorkspaces("Default"), service.loadWorkspaces("Default")]);

    expect(getAll).toHaveBeenCalledOnce();
    expect(useWorkspaceStore.getState().workspaces.map((workspace) => workspace.name)).toEqual([
      "Acme",
    ]);
  });

  it("creates and renames workspaces, trimming names", async () => {
    const { service, repository } = setUp();
    await service.loadWorkspaces("Default");

    const created = await service.createWorkspace("  Side project ");
    if (!created.ok) throw new Error("expected the workspace to be created");
    const renamed = await service.renameWorkspace(created.value.id, "Client work");

    expect(renamed.ok && renamed.value.name).toBe("Client work");
    expect((await repository.get(created.value.id))?.name).toBe("Client work");
  });

  it("refuses empty names and unknown workspaces", async () => {
    const { service } = setUp();
    await service.loadWorkspaces("Default");
    const [first] = useWorkspaceStore.getState().workspaces;
    if (!first) throw new Error("expected a workspace");

    expect(await service.createWorkspace("   ")).toEqual({ ok: false, error: "invalid_name" });
    expect(await service.renameWorkspace(first.id, "")).toEqual({
      ok: false,
      error: "invalid_name",
    });
    expect(await service.renameWorkspace(createWorkspace({ name: "x" }).id, "New")).toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("rolls back an optimistic change when the write fails", async () => {
    const { service, repository } = setUp();
    await service.loadWorkspaces("Default");
    const [first] = useWorkspaceStore.getState().workspaces;
    if (!first) throw new Error("expected a workspace");
    vi.spyOn(repository, "put").mockRejectedValueOnce(new Error("QuotaExceededError"));

    const result = await service.renameWorkspace(first.id, "Renamed");

    expect(result).toEqual({ ok: false, error: "storage" });
    expect(useWorkspaceStore.getState().workspaces[0]?.name).toBe(first.name);
  });

  it("deletes a workspace with its collections, items, environments, tabs and drafts", async () => {
    const { service } = setUp();
    await service.loadWorkspaces("Default");
    const created = await service.createWorkspace("Disposable");
    if (!created.ok) throw new Error("expected the workspace to be created");
    const workspace: Workspace = created.value;
    const sortKey = sortKeyBetween(null, null);
    const collection = createCollection({ workspaceId: workspace.id, name: "API", sortKey });
    await database.collections.put(collection);
    await database.collectionItems.put(
      createRequestItem({ collectionId: collection.id, parentId: null, name: "Ping", sortKey }),
    );
    await database.environments.put(
      createEnvironment({ workspaceId: workspace.id, name: "Local", sortKey }),
    );
    const tab = createEditorTab({ workspaceId: workspace.id });
    await database.tabLayouts.put({
      ...createTabLayout({ workspaceId: workspace.id }),
      tabs: [tab],
    });
    await database.drafts.put({
      tabId: tab.id,
      workspaceId: workspace.id,
      baseUpdatedAt: null,
      name: "Untitled",
      request: createHttpRequestDefinition(),
    });

    expect(await service.deleteWorkspace(workspace.id)).toEqual({ ok: true, value: null });
    expect(await database.tabLayouts.count()).toBe(0);
    expect(await database.drafts.count()).toBe(0);
    expect(await database.collections.count()).toBe(0);
    expect(await database.collectionItems.count()).toBe(0);
    expect(await database.environments.count()).toBe(0);
    expect(await database.workspaces.count()).toBe(1);
  });

  it("never deletes the last workspace", async () => {
    const { service } = setUp();
    await service.loadWorkspaces("Default");
    const [only] = useWorkspaceStore.getState().workspaces;
    if (!only) throw new Error("expected a workspace");

    expect(await service.deleteWorkspace(only.id)).toEqual({ ok: false, error: "last_workspace" });
  });

  it("reopens the last workspace, falling back to the first", async () => {
    const { service, storage } = setUp();
    await service.loadWorkspaces("Default");
    const second = await service.createWorkspace("Second");
    if (!second.ok) throw new Error("expected the workspace to be created");

    expect(service.pickWorkspaceToOpen()?.name).toBe("Default");
    service.openWorkspace(second.value.id);
    expect(storage.getItem(LAST_WORKSPACE_COOKIE)).toBe(second.value.id);
    expect(service.pickWorkspaceToOpen()?.id).toBe(second.value.id);

    await service.deleteWorkspace(second.value.id);
    expect(storage.getItem(LAST_WORKSPACE_COOKIE)).toBeNull();
    expect(service.pickWorkspaceToOpen()?.name).toBe("Default");
  });

  it("sets and clears the active environment", async () => {
    const { service, repository } = setUp();
    await service.loadWorkspaces("Default");
    const [workspace] = useWorkspaceStore.getState().workspaces;
    if (!workspace) throw new Error("expected a workspace");
    const environmentId = createId<"EnvironmentId">();

    await service.setActiveEnvironment(workspace.id, environmentId);
    expect((await repository.get(workspace.id))?.activeEnvironmentId).toBe(environmentId);

    await service.setActiveEnvironment(workspace.id, null);
    expect(useWorkspaceStore.getState().workspaces[0]?.activeEnvironmentId).toBeNull();
  });

  it("picks up changes made in another tab", async () => {
    const channelName = `changes-${crypto.randomUUID()}`;
    const otherTabFeed = createChangeFeed(channelName);
    const thisTabFeed = createChangeFeed(channelName);
    feeds.push(otherTabFeed, thisTabFeed);
    const otherTab = createWorkspaceRepository(database, { changeFeed: otherTabFeed });
    const { service } = setUp({ changeFeed: thisTabFeed });
    await service.loadWorkspaces("Default");
    const stopSync = service.syncWithOtherTabs();

    const fromOtherTab = createWorkspace({ name: "From another tab" });
    await otherTab.put(fromOtherTab);

    await vi.waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces.map((workspace) => workspace.id)).toContain(
        fromOtherTab.id,
      );
    });
    stopSync();
  });
});
