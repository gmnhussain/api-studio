import { beforeEach, describe, expect, it } from "vitest";

import {
  createEditorTab,
  createWorkspace,
  RECENTLY_CLOSED_TABS_LIMIT,
  type EditorTab,
} from "@api-studio/core";

import { otherTabIds, tabIdsToTheRight } from "./tab-order";
import { getInitialTabsState, useTabsStore } from "./tabs.store";

const workspace = createWorkspace({ name: "Acme" });

function tab(name: string, fields: Partial<EditorTab> = {}): EditorTab {
  return { ...createEditorTab({ workspaceId: workspace.id, entityId: name }), ...fields };
}

const store = () => useTabsStore.getState();
const names = () => store().tabs.map((openTab) => openTab.entityId);

function openTabs(...tabs: EditorTab[]) {
  store().startLoading(workspace.id);
  store().setLoaded({ tabs, activeTabId: tabs[0]?.id ?? null, recentlyClosed: [] });
}

beforeEach(() => {
  useTabsStore.setState(getInitialTabsState());
});

describe("tabs store", () => {
  it("restores a layout, falling back to the first tab when the active one is gone", () => {
    const first = tab("a");
    store().startLoading(workspace.id);
    store().setLoaded({ tabs: [first, tab("b")], activeTabId: tab("x").id, recentlyClosed: [] });

    expect(store()).toMatchObject({ status: "ready", activeTabId: first.id });
  });

  it("opens tabs at the end and activates them", () => {
    openTabs(tab("a"));
    const next = tab("b");

    store().openTab(next);

    expect(names()).toEqual(["a", "b"]);
    expect(store().activeTabId).toBe(next.id);
  });

  it("activates the next tab to the right when the active one closes, else the left", () => {
    const [a, b, c] = [tab("a"), tab("b"), tab("c")];
    openTabs(a, b, c);
    store().activateTab(b.id);

    store().closeTabs([b.id]);
    expect(store().activeTabId).toBe(c.id);

    store().closeTabs([c.id]);
    expect(store().activeTabId).toBe(a.id);

    store().closeTabs([a.id]);
    expect(store().activeTabId).toBeNull();
  });

  it("remembers closed saved tabs newest first, but not unsaved ones", () => {
    const [a, b, unsaved] = [tab("a"), tab("b"), tab("new", { entityId: null })];
    openTabs(a, b, unsaved);

    store().closeTabs([a.id]);
    store().closeTabs([b.id, unsaved.id]);

    expect(store().recentlyClosed.map((closed) => closed.entityId)).toEqual(["b", "a"]);
    expect(store().takeRecentlyClosed()?.entityId).toBe("b");
    expect(store().takeRecentlyClosed()?.entityId).toBe("a");
    expect(store().takeRecentlyClosed()).toBeUndefined();
  });

  it("keeps at most the limit of closed tabs", () => {
    const tabs = Array.from({ length: RECENTLY_CLOSED_TABS_LIMIT + 5 }, (_, index) =>
      tab(`t${String(index)}`),
    );
    openTabs(...tabs);

    store().closeTabs(tabs.map((closing) => closing.id));

    expect(store().recentlyClosed).toHaveLength(RECENTLY_CLOSED_TABS_LIMIT);
  });

  it("keeps pinned tabs first when pinning, unpinning and moving", () => {
    const [a, b, c, d] = [tab("a"), tab("b"), tab("c"), tab("d")];
    openTabs(a, b, c, d);

    store().setPinned(c.id, true);
    expect(names()).toEqual(["c", "a", "b", "d"]);

    store().setPinned(d.id, true);
    expect(names()).toEqual(["c", "d", "a", "b"]);

    store().moveTab(a.id, 0);
    expect(names()).toEqual(["c", "d", "a", "b"]);

    store().moveTab(c.id, 3);
    expect(names()).toEqual(["d", "c", "a", "b"]);

    store().setPinned(d.id, false);
    expect(names()).toEqual(["c", "d", "a", "b"]);

    store().moveTab(tab("missing").id, 0);
    store().setPinned(c.id, true);
    expect(names()).toEqual(["c", "d", "a", "b"]);
  });

  it("moves between tabs by offset with wrap-around, and by position", () => {
    const [a, b, c] = [tab("a"), tab("b"), tab("c")];
    openTabs(a, b, c);

    store().activateRelativeTab(-1);
    expect(store().activeTabId).toBe(c.id);
    store().activateRelativeTab(1);
    expect(store().activeTabId).toBe(a.id);

    store().activateTabAt(1);
    expect(store().activeTabId).toBe(b.id);
    store().activateTabAt(8);
    expect(store().activeTabId).toBe(b.id);

    store().activateTab(tab("missing").id);
    expect(store().activeTabId).toBe(b.id);
  });

  it("points a tab at a saved item", () => {
    const unsaved = tab("new", { entityId: null });
    openTabs(unsaved);

    store().setTabEntity(unsaved.id, "item-1");

    expect(store().tabs[0]?.entityId).toBe("item-1");
  });
});

describe("tab groups for closing", () => {
  it("never include pinned tabs", () => {
    const [pinned, a, b, c] = [tab("p", { isPinned: true }), tab("a"), tab("b"), tab("c")];
    const tabs = [pinned, a, b, c];

    expect(otherTabIds(tabs, b.id)).toEqual([a.id, c.id]);
    expect(tabIdsToTheRight(tabs, a.id)).toEqual([b.id, c.id]);
    expect(tabIdsToTheRight(tabs, tab("missing").id)).toEqual([]);
  });
});
