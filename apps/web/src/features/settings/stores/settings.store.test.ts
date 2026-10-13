import { afterEach, describe, expect, it } from "vitest";

import { readBrowserCookie } from "@/lib/cookies/browser-cookie-storage";
import { readPersistedState } from "@/lib/cookies/read-persisted-state";

import { DEFAULT_APPEARANCE, SETTINGS_COOKIE } from "../settings.constants";
import { createSettingsStore } from "./settings.store";

afterEach(() => {
  document.cookie = `${SETTINGS_COOKIE}=; path=/; max-age=0`;
});

describe("settings store", () => {
  it("starts with the default appearance before hydration", () => {
    const store = createSettingsStore();

    expect(store.getState().appearance).toEqual(DEFAULT_APPEARANCE);
    expect(store.getState().hasHydrated).toBe(false);
  });

  it("persists an appearance change into the settings cookie", () => {
    const store = createSettingsStore();

    store.getState().setAppearance("accent", "iris");

    expect(readPersistedState(readBrowserCookie(SETTINGS_COOKIE))).toEqual({
      appearance: { ...DEFAULT_APPEARANCE, accent: "iris" },
    });
  });

  it("rehydrates a saved appearance and sanitises invalid values", async () => {
    document.cookie = `${SETTINGS_COOKIE}=${encodeURIComponent(
      JSON.stringify({ state: { appearance: { theme: "light", accent: "neon" } }, version: 1 }),
    )}; path=/`;
    const store = createSettingsStore();

    await store.persist.rehydrate();

    expect(store.getState().appearance).toEqual({ ...DEFAULT_APPEARANCE, theme: "light" });
  });

  it("resets the appearance to the defaults", () => {
    const store = createSettingsStore();
    store.getState().setAppearance("density", "compact");

    store.getState().resetAppearance();

    expect(store.getState().appearance).toEqual(DEFAULT_APPEARANCE);
  });
});
