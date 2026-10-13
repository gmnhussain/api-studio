import { afterEach, describe, expect, it } from "vitest";

import { readBrowserCookie } from "@/lib/cookies/browser-cookie-storage";
import { readPersistedState } from "@/lib/cookies/read-persisted-state";

import { LAYOUT_COOKIE } from "../shell.constants";
import { DEFAULT_UI_STATE } from "../shell.schema";
import { createUiStore, isPanelCollapsed } from "./ui.store";

afterEach(() => {
  document.cookie = `${LAYOUT_COOKIE}=; path=/; max-age=0`;
});

describe("ui store", () => {
  it("starts from the state the server read", () => {
    const store = createUiStore({ sidebarSection: "variables", layouts: {} });

    expect(store.getState().sidebarSection).toBe("variables");
  });

  it("saves the section and layouts into the layout cookie", () => {
    const store = createUiStore(DEFAULT_UI_STATE);

    store.getState().setSidebarSection("history");
    store.getState().setLayout("workbench", { sidebar: 25, center: 75 });

    expect(readPersistedState(readBrowserCookie(LAYOUT_COOKIE))).toEqual({
      sidebarSection: "history",
      layouts: { workbench: { sidebar: 25, center: 75 } },
    });
  });

  it("replaces one group's layout without touching the others", () => {
    const store = createUiStore({
      sidebarSection: "collections",
      layouts: { center: { editors: 70, console: 30 } },
    });

    store.getState().setLayout("workbench", { sidebar: 0, center: 100 });

    expect(store.getState().layouts).toEqual({
      center: { editors: 70, console: 30 },
      workbench: { sidebar: 0, center: 100 },
    });
  });
});

describe("isPanelCollapsed", () => {
  it("is true only for a saved size of 0", () => {
    const layouts = {
      workbench: { sidebar: 0, center: 100 },
      center: { editors: 80, console: 20 },
    };

    expect(isPanelCollapsed(layouts, "workbench", "sidebar")).toBe(true);
    expect(isPanelCollapsed(layouts, "center", "console")).toBe(false);
    expect(isPanelCollapsed(layouts, "editors-vertical", "response")).toBe(false);
  });
});
