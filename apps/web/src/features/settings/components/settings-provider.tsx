"use client";

import { useEffect, useState, type ReactNode } from "react";

import { applyAppearance, subscribeToSystemTheme } from "../lib/apply-appearance";
import { SettingsStoreContext } from "../stores/settings-store-context";
import { createSettingsStore } from "../stores/settings.store";

/**
 * Creates the page's settings store, rehydrates it from the cookie after mount and keeps
 * `<html>` in step with the appearance: on every change, and on OS theme changes while the
 * theme is `system`. The boot script already applied the saved values before the first paint,
 * so rehydration causes no visible change.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createSettingsStore);

  useEffect(() => {
    let stopFollowingSystemTheme: (() => void) | undefined;

    const apply = () => {
      const state = store.getState();
      const resolvedTheme = applyAppearance(state.appearance);
      if (resolvedTheme !== state.resolvedTheme) store.setState({ resolvedTheme });
    };

    const followSystemTheme = () => {
      stopFollowingSystemTheme?.();
      stopFollowingSystemTheme =
        store.getState().appearance.theme === "system" ? subscribeToSystemTheme(apply) : undefined;
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.appearance === previous.appearance) return;
      apply();
      if (state.appearance.theme !== previous.appearance.theme) followSystemTheme();
    });

    void Promise.resolve(store.persist.rehydrate()).then(() => {
      store.setState({ hasHydrated: true });
      apply();
      followSystemTheme();
    });

    return () => {
      unsubscribe();
      stopFollowingSystemTheme?.();
    };
  }, [store]);

  return <SettingsStoreContext.Provider value={store}>{children}</SettingsStoreContext.Provider>;
}
