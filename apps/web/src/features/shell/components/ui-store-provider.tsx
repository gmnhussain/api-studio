"use client";

import { useState, type ReactNode } from "react";

import { UiStoreContext } from "../stores/ui-store-context";
import { createUiStore, type UiState } from "../stores/ui.store";

/** Props for {@link UiStoreProvider}. */
export type UiStoreProviderProps = {
  /** The UI state read from the layout cookie on the server. */
  initialState: UiState;
  children: ReactNode;
};

/** Creates the page's UI store from the server-read layout, once per mount (ADR-0011). */
export function UiStoreProvider({ initialState, children }: UiStoreProviderProps) {
  const [store] = useState(() => createUiStore(initialState));
  return <UiStoreContext.Provider value={store}>{children}</UiStoreContext.Provider>;
}
