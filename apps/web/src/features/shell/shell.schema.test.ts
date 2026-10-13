import { describe, expect, it } from "vitest";

import { DEFAULT_UI_STATE, parseUiState } from "./shell.schema";

describe("parseUiState", () => {
  it("keeps a valid section and layouts", () => {
    const saved = {
      sidebarSection: "history",
      layouts: { workbench: { sidebar: 22, center: 78 }, center: { editors: 70, console: 30 } },
    };

    expect(parseUiState(saved)).toEqual(saved);
  });

  it("drops unknown groups and invalid layouts but keeps the rest", () => {
    const saved = {
      sidebarSection: "history",
      layouts: {
        workbench: { sidebar: 0, center: 100 },
        center: { editors: 140 },
        "editors-horizontal": "wide",
        floating: { panel: 50 },
      },
    };

    expect(parseUiState(saved)).toEqual({
      sidebarSection: "history",
      layouts: { workbench: { sidebar: 0, center: 100 } },
    });
  });

  it("falls back to the default section on its own", () => {
    expect(parseUiState({ sidebarSection: "mail", layouts: {} })).toEqual(DEFAULT_UI_STATE);
  });

  it.each([undefined, null, "layout", 7, []])("falls back to the defaults for %j", (saved) => {
    expect(parseUiState(saved)).toEqual(DEFAULT_UI_STATE);
  });
});
