"use client";

import { useContext } from "react";
import { useStore } from "zustand";

import { SettingsStoreContext } from "../stores/settings-store-context";
import type { SettingsActions, SettingsState } from "../stores/settings.store";

/**
 * Reads from the settings store with a selector, so a component re-renders only when the
 * selected value changes.
 *
 * @throws When used outside `SettingsProvider`.
 */
export function useSettings<Selected>(
  selector: (state: SettingsState & SettingsActions) => Selected,
): Selected {
  const store = useContext(SettingsStoreContext);
  if (!store) throw new Error("useSettings must be used inside SettingsProvider");
  return useStore(store, selector);
}
