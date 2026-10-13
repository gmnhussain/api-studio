// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createEditorTab, createWorkspace } from "@api-studio/core";

import { createDatabase, type ApiStudioDatabase } from "@/lib/db/database";

import { createTabsService } from "./tabs.service";
import { createTabLayoutRepository } from "../repositories/tab-layout.repository";
import { getInitialTabsState, useTabsStore } from "../stores/tabs.store";

const NOW = "2026-10-14T09:30:00.000Z";
const workspace = createWorkspace({ name: "Acme" });
let database: ApiStudioDatabase;

function setUp(onSaveFailed?: () => void) {
  const repository = createTabLayoutRepository(database);
  const service = createTabsService({
    repository,
    store: useTabsStore,
    now: () => NOW,
    ...(onSaveFailed ? { onSaveFailed } : {}),
  });
  return { repository, service };
}

beforeEach(() => {
  database = createDatabase(`test-${crypto.randomUUID()}`);
  useTabsStore.setState(getInitialTabsState());
});

afterEach(async () => {
  await database.delete();
});

describe("tabs service", () => {
  it("saves the layout after changes, and reads it back", async () => {
    const { service } = setUp();
    const stop = service.saveChanges();
    const tab = createEditorTab({ workspaceId: workspace.id, entityId: "item" });
    useTabsStore.getState().startLoading(workspace.id);
    useTabsStore.getState().setLoaded({ tabs: [], activeTabId: null, recentlyClosed: [] });

    useTabsStore.getState().openTab(tab);
    useTabsStore.getState().setPinned(tab.id, true);
    await service.flush();
    stop();

    expect(await service.readLayout(workspace.id)).toEqual({
      workspaceId: workspace.id,
      tabs: [{ ...tab, isPinned: true }],
      activeTabId: tab.id,
      recentlyClosed: [],
      updatedAt: NOW,
    });
  });

  it("writes nothing while a workspace is still loading or after it stops", async () => {
    const { service, repository } = setUp();
    const put = vi.spyOn(repository, "put");
    const stop = service.saveChanges();

    useTabsStore.getState().startLoading(workspace.id);
    useTabsStore.getState().openTab(createEditorTab({ workspaceId: workspace.id }));
    await service.flush();
    stop();
    useTabsStore.getState().setLoaded({ tabs: [], activeTabId: null, recentlyClosed: [] });
    await service.flush();

    expect(put).not.toHaveBeenCalled();
  });

  it("reports a failed save", async () => {
    const onSaveFailed = vi.fn();
    const { service, repository } = setUp(onSaveFailed);
    vi.spyOn(repository, "put").mockRejectedValueOnce(new Error("QuotaExceededError"));
    service.saveChanges();
    useTabsStore.getState().startLoading(workspace.id);
    useTabsStore.getState().setLoaded({ tabs: [], activeTabId: null, recentlyClosed: [] });

    useTabsStore.getState().openTab(createEditorTab({ workspaceId: workspace.id }));
    await service.flush();

    expect(onSaveFailed).toHaveBeenCalledTimes(1);
  });
});
