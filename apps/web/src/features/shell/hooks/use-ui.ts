"use client";

import { useContext } from "react";
import { useStore } from "zustand";

import { UiStoreContext } from "../stores/ui-store-context";
import type { UiActions, UiState } from "../stores/ui.store";

/**
 * Reads from the UI store with a selector, so a component re-renders only when the selected
 * value changes.
 *
 * @throws When used outside `UiStoreProvider`.
 */
export function useUi<Selected>(selector: (state: UiState & UiActions) => Selected): Selected {
  const store = useContext(UiStoreContext);
  if (!store) throw new Error("useUi must be used inside UiStoreProvider");
  return useStore(store, selector);
}
