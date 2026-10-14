// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createEditorTab,
  createHttpRequestDefinition,
  createTabLayout,
  createWorkspace,
  withUrl,
  type RequestItem,
  type Result,
  type TabId,
} from "@api-studio/core";

import {
  createCollectionRepository,
  createCollectionService,
  getInitialCollectionState,
  useCollectionStore,
} from "@/features/collections";
import {
  createTabLayoutRepository,
  createTabsService,
  getInitialTabsState,
  useTabsStore,
} from "@/features/tabs";
import { createDatabase, type ApiStudioDatabase } from "@/lib/db/database";

import { createRequestService, type RequestService } from "./request.service";
import { createDraftRepository } from "../repositories/draft.repository";
import { getInitialRequestState, useRequestStore } from "../stores/request.store";

const workspace = createWorkspace({ name: "Acme" });
let database: ApiStudioDatabase;
const stops: (() => void)[] = [];

function expectOk<Value>(result: Result<Value, string>): Value {
  if (!result.ok) throw new Error(`expected success, got ${result.error}`);
  return result.value;
}

/** A fresh app over the same database, as after a reload; `failRestore` breaks reading drafts. */
async function startApp({ failRestore = false }: { failRestore?: boolean } = {}) {
  useTabsStore.setState(getInitialTabsState());
  useRequestStore.setState(getInitialRequestState());
  useCollectionStore.setState(getInitialCollectionState());
  let tick = 0;
  const collectionRepository = createCollectionRepository(database);
  const collectionService = createCollectionService({
    repository: collectionRepository,
    store: useCollectionStore,
    now: () => new Date(Date.UTC(2026, 9, 14, 9, 0, tick++)).toISOString(),
  });
  const tabsService = createTabsService({
    repository: createTabLayoutRepository(database),
    store: useTabsStore,
  });
  const draftRepository = createDraftRepository(database);
  if (failRestore) {
    vi.spyOn(draftRepository, "findBy").mockRejectedValueOnce(new Error("SecurityError"));
  }
  const service = createRequestService({
    draftRepository,
    requestStore: useRequestStore,
    tabsStore: useTabsStore,
    collectionStore: useCollectionStore,
    tabsService,
    collectionService,
  });
  stops.push(service.start(), tabsService.saveChanges());
  const opened = await service.openWorkspace(workspace.id);
  if (!failRestore) expectOk(opened);
  return { service, collectionService, collectionRepository, draftRepository };
}

function stopApp() {
  for (const stop of stops.splice(0)) stop();
}

const draftOf = (tabId: TabId) => useRequestStore.getState().drafts[tabId];
const tabIds = () => useTabsStore.getState().tabs.map((tab) => tab.id);

function edit(tabId: TabId, url: string) {
  useRequestStore.getState().editRequest(tabId, (request) => withUrl(request, url));
}

async function saveNew(service: RequestService, tabId: TabId): Promise<RequestItem> {
  return expectOk(
    await service.saveAs(tabId, { name: "Users", location: { newCollectionName: "API" } }),
  );
}

beforeEach(() => {
  database = createDatabase(`test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  stopApp();
  await database.delete();
});

describe("request service", () => {
  it("restores open tabs and their drafts exactly after a reload", async () => {
    const { service } = await startApp();
    const tabId = service.newRequest("Untitled request");
    if (!tabId) throw new Error("expected a tab");
    edit(tabId, "{{base}}/users/:id?page=2");
    useRequestStore.getState().editRequest(tabId, (request) => ({ ...request, method: "POST" }));
    const draft = draftOf(tabId);
    await service.flush();
    stopApp();

    await startApp();

    expect(tabIds()).toEqual([tabId]);
    expect(useTabsStore.getState().activeTabId).toBe(tabId);
    expect(draftOf(tabId)).toEqual(draft);
  });

  it("asks for a location the first time, then saves in place", async () => {
    const { service, collectionRepository, draftRepository } = await startApp();
    const tabId = service.newRequest("Untitled request");
    if (!tabId) throw new Error("expected a tab");
    edit(tabId, "/users");

    expect(service.isDirty(tabId)).toBe(true);
    expect(await service.save(tabId)).toEqual({ ok: false, error: "needs_location" });

    const saved = await saveNew(service, tabId);
    expect(useTabsStore.getState().tabs[0]?.entityId).toBe(saved.id);
    // Written at once, without waiting for auto-save, so a reload right away shows the save.
    expect(await draftRepository.get(tabId)).toMatchObject({
      name: saved.name,
      baseUpdatedAt: saved.updatedAt,
    });
    expect(service.isDirty(tabId)).toBe(false);

    edit(tabId, "/users?active=true");
    expect(service.isDirty(tabId)).toBe(true);
    const resaved = expectOk(await service.save(tabId));
    expect(service.isDirty(tabId)).toBe(false);
    expect(await collectionRepository.items.get(saved.id)).toEqual(resaved);
    expect(resaved.request.url).toBe("/users?active=true");
  });

  it("refuses an invalid name and leaves the draft as it is", async () => {
    const { service } = await startApp();
    const tabId = service.newRequest("Untitled request");
    if (!tabId) throw new Error("expected a tab");

    expect(service.renameDraft(tabId, "   ")).toEqual({ ok: false, error: "invalid_name" });
    expect(expectOk(service.renameDraft(tabId, " Login "))).toBeNull();
    expect(draftOf(tabId)?.name).toBe("Login");
    expect(
      await service.saveAs(tabId, { name: " ", location: { newCollectionName: "API" } }),
    ).toEqual({ ok: false, error: "invalid_name" });
  });

  it("deletes the draft of a closed tab and reopens it from the saved request", async () => {
    const { service, draftRepository } = await startApp();
    const tabId = service.newRequest("Untitled request");
    if (!tabId) throw new Error("expected a tab");
    edit(tabId, "/users");
    const saved = await saveNew(service, tabId);
    await service.flush();

    useTabsStore.getState().closeTabs([tabId]);
    await service.flush();

    expect(draftOf(tabId)).toBeUndefined();
    expect(await draftRepository.get(tabId)).toBeUndefined();

    const reopened = service.reopenClosedTab();
    if (!reopened) throw new Error("expected the tab to reopen");
    expect(draftOf(reopened)).toMatchObject({ name: saved.name, request: saved.request });
    expect(service.reopenClosedTab()).toBeNull();
    expect(expectOk(service.openRequest(saved.id))).toBe(reopened);
  });

  it("follows saves made elsewhere unless the draft has changes of its own", async () => {
    const { service, collectionService } = await startApp();
    const clean = service.newRequest("Untitled request");
    const edited = service.newRequest("Untitled request");
    if (!clean || !edited) throw new Error("expected tabs");
    edit(clean, "/clean");
    edit(edited, "/edited");
    const cleanSaved = await saveNew(service, clean);
    const editedSaved = await saveNew(service, edited);
    edit(edited, "/edited?mine=1");

    const elsewhere = withUrl(createHttpRequestDefinition(), "/changed-elsewhere");
    expectOk(
      await collectionService.saveRequest(cleanSaved.id, { name: "Users", request: elsewhere }),
    );
    expectOk(
      await collectionService.saveRequest(editedSaved.id, { name: "Users", request: elsewhere }),
    );

    expect(draftOf(clean)?.request.url).toBe("/changed-elsewhere");
    expect(service.isDirty(clean)).toBe(false);
    expect(draftOf(edited)?.request.url).toBe("/edited?mine=1");

    service.keepChanges(edited);
    expect(draftOf(edited)?.request.url).toBe("/edited?mine=1");
    service.reloadSaved(edited);
    expect(draftOf(edited)?.request.url).toBe("/changed-elsewhere");
  });

  it("turns a tab whose request was deleted into a new request", async () => {
    const { service, collectionService } = await startApp();
    const tabId = service.newRequest("Untitled request");
    if (!tabId) throw new Error("expected a tab");
    edit(tabId, "/users");
    const saved = await saveNew(service, tabId);

    expectOk(await collectionService.deleteItem(saved.id));

    expect(useTabsStore.getState().tabs[0]?.entityId).toBeNull();
    expect(draftOf(tabId)).toMatchObject({ baseUpdatedAt: null, request: { url: "/users" } });
    expect(await service.save(tabId)).toEqual({ ok: false, error: "needs_location" });
  });

  it("repairs a restored layout: missing drafts, missing requests and orphaned drafts", async () => {
    const first = await startApp();
    const savedTab = first.service.newRequest("Untitled request");
    if (!savedTab) throw new Error("expected a tab");
    edit(savedTab, "/saved");
    const saved = await saveNew(first.service, savedTab);
    await first.service.flush();
    stopApp();

    const withoutDraft = { ...createEditorTab({ workspaceId: workspace.id }), entityId: saved.id };
    const withNothing = createEditorTab({ workspaceId: workspace.id });
    await database.drafts.delete(savedTab);
    await database.drafts.put({
      tabId: createEditorTab({ workspaceId: workspace.id }).id,
      workspaceId: workspace.id,
      baseUpdatedAt: null,
      name: "Orphan",
      request: createHttpRequestDefinition(),
    });
    await database.tabLayouts.put({
      ...createTabLayout({ workspaceId: workspace.id }),
      tabs: [withoutDraft, withNothing],
      activeTabId: withNothing.id,
    });

    await startApp();

    expect(tabIds()).toEqual([withoutDraft.id]);
    expect(useTabsStore.getState().activeTabId).toBe(withoutDraft.id);
    expect(draftOf(withoutDraft.id)?.request.url).toBe("/saved");
    expect(await database.drafts.count()).toBe(1);
  });

  it("marks the restore as failed, and saves no tabs over the stored ones", async () => {
    const first = await startApp();
    const tabId = first.service.newRequest("Untitled request");
    if (!tabId) throw new Error("expected a tab");
    await first.service.flush();
    stopApp();
    const restored = await startApp({ failRestore: true });

    expect(useTabsStore.getState().status).toBe("failed");
    expect(restored.service.newRequest("Untitled request")).toBeNull();
    await restored.service.flush();
    expect((await database.tabLayouts.get(workspace.id))?.tabs).toHaveLength(1);
  });

  it("opens nothing before a workspace is loaded", () => {
    useTabsStore.setState(getInitialTabsState());
    const service = createRequestService({
      draftRepository: createDraftRepository(database),
      requestStore: useRequestStore,
      tabsStore: useTabsStore,
      collectionStore: useCollectionStore,
      tabsService: createTabsService({
        repository: createTabLayoutRepository(database),
        store: useTabsStore,
      }),
      collectionService: createCollectionService({
        repository: createCollectionRepository(database),
        store: useCollectionStore,
      }),
    });

    expect(service.newRequest("Untitled request")).toBeNull();
    expect(service.reopenClosedTab()).toBeNull();
    expect(service.isDirty(createEditorTab({ workspaceId: workspace.id }).id)).toBe(false);
  });
});
