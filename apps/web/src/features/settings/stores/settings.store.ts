import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { browserCookieStorage } from "@/lib/cookies/browser-cookie-storage";

import {
  DEFAULT_APPEARANCE,
  SETTINGS_COOKIE,
  type Appearance,
  type ResolvedTheme,
} from "../settings.constants";
import { parseAppearance } from "../settings.schema";

/** Settings that are persisted; editor and request settings join `appearance` later. */
type PersistedSettings = { appearance: Appearance };

export type SettingsState = PersistedSettings & {
  /** The colour scheme shown, with `system` resolved. */
  resolvedTheme: ResolvedTheme;
  /** `false` until the saved cookie has been read in the browser. */
  hasHydrated: boolean;
};

export type SettingsActions = {
  setAppearance: <Key extends keyof Appearance>(key: Key, value: Appearance[Key]) => void;
  resetAppearance: () => void;
};

export type SettingsStore = ReturnType<typeof createSettingsStore>;

/** Version of the persisted settings; bump it with a migration when the shape changes. */
const SETTINGS_VERSION = 1;

/**
 * Initial state, exported so tests can reset a store between cases.
 */
export function getInitialSettingsState(): SettingsState {
  return { appearance: DEFAULT_APPEARANCE, resolvedTheme: "dark", hasHydrated: false };
}

/**
 * Creates the settings store (ADR-0011). One store per request on the server and one per page in
 * the browser, created by `SettingsProvider`. It persists into a cookie and rehydrates after mount.
 */
export function createSettingsStore() {
  return createStore<SettingsState & SettingsActions>()(
    persist(
      (set) => ({
        ...getInitialSettingsState(),
        setAppearance: (key, value) => {
          set((state) => ({ appearance: { ...state.appearance, [key]: value } }));
        },
        resetAppearance: () => {
          set({ appearance: DEFAULT_APPEARANCE });
        },
      }),
      {
        name: SETTINGS_COOKIE,
        version: SETTINGS_VERSION,
        storage: createJSONStorage(() => browserCookieStorage),
        // The cookie is unreadable during server rendering; SettingsProvider rehydrates on mount.
        skipHydration: true,
        partialize: (state): PersistedSettings => ({ appearance: state.appearance }),
        merge: (persisted, current) => {
          const savedAppearance =
            typeof persisted === "object" && persisted !== null && "appearance" in persisted
              ? persisted.appearance
              : undefined;
          return { ...current, appearance: parseAppearance(savedAppearance) };
        },
      },
    ),
  );
}
