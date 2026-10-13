import { runInNewContext } from "node:vm";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SETTINGS_COOKIE } from "../settings.constants";
import { parseAppearance } from "../settings.schema";
import { applyAppearance } from "./apply-appearance";
import { SETTINGS_BOOT_SCRIPT } from "./settings-boot-script";

/** Snapshot of everything the boot script and applyAppearance write onto an element. */
function describeRoot(root: HTMLElement) {
  return {
    isDark: root.classList.contains("dark"),
    attributes: Object.fromEntries(
      root.getAttributeNames().map((name) => [name, root.getAttribute(name)]),
    ),
  };
}

function setSettingsCookie(value: string) {
  document.cookie = `${SETTINGS_COOKIE}=${encodeURIComponent(value)}; path=/`;
}

function stubSystemTheme(prefersDark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: prefersDark, media: query }));
}

/** Runs the boot script against a fresh `<html>` the way the browser does, before any bundle. */
function runBootScript(): HTMLElement {
  const root = document.createElement("html");
  runInNewContext(SETTINGS_BOOT_SCRIPT, {
    document: { cookie: document.cookie, documentElement: root },
    window: { matchMedia: (query: string) => window.matchMedia(query) },
  });
  return root;
}

/** Applies the same cookie through the typed code path used after hydration. */
function runApplyAppearance(savedState: unknown): HTMLElement {
  const root = document.createElement("html");
  const appearance =
    typeof savedState === "object" && savedState !== null && "appearance" in savedState
      ? savedState.appearance
      : undefined;
  applyAppearance(parseAppearance(appearance), root);
  return root;
}

describe("settings boot script", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
      callback();
      return 0;
    });
  });

  afterEach(() => {
    document.cookie = `${SETTINGS_COOKIE}=; path=/; max-age=0`;
    vi.unstubAllGlobals();
  });

  it.each([
    ["no cookie", null, false],
    [
      "a full appearance",
      { appearance: { theme: "light", accent: "ember", density: "compact", motion: "reduce" } },
      false,
    ],
    ["partly invalid values", { appearance: { theme: "sepia", accent: "moss" } }, false],
    ["system theme on a dark OS", { appearance: { theme: "system" } }, true],
    ["system theme on a light OS", { appearance: { theme: "system" } }, false],
  ] as const)("matches applyAppearance for %s", (_case, savedState, prefersDark) => {
    stubSystemTheme(prefersDark);
    if (savedState) setSettingsCookie(JSON.stringify({ state: savedState, version: 1 }));

    expect(describeRoot(runBootScript())).toEqual(describeRoot(runApplyAppearance(savedState)));
  });

  it("falls back to the defaults for a malformed cookie", () => {
    stubSystemTheme(false);
    setSettingsCookie("{not json");

    expect(describeRoot(runBootScript())).toEqual(describeRoot(runApplyAppearance(undefined)));
  });
});
