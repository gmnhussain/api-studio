import type { Disposable } from "@api-studio/core";

import { useTabsStore } from "@/features/tabs";

import { BUILT_IN_RESPONSE_VIEWERS } from "./components/viewers/built-in-response-viewers";
import { responseViewers } from "./lib/response-viewers";
import { useResponseViewerStore } from "./stores/response-viewer.store";

let registration: Disposable | undefined;

/**
 * Registers what the response viewer contributes (extensibility.md#registries): the built-in
 * body views. It also forgets the view choices of tabs as they close. Calling it again while
 * registered returns the same registration.
 */
export function registerResponseViewerContributions(): Disposable {
  if (registration) return registration;
  const disposables = BUILT_IN_RESPONSE_VIEWERS.map((viewer) => responseViewers.register(viewer));
  const unsubscribe = useTabsStore.subscribe((state, previous) => {
    if (state.tabs === previous.tabs) return;
    const open = new Set(state.tabs.map((tab) => tab.id));
    const closed = previous.tabs.map((tab) => tab.id).filter((tabId) => !open.has(tabId));
    if (closed.length > 0) useResponseViewerStore.getState().forgetTabs(closed);
  });
  const current: Disposable = {
    dispose: () => {
      for (const disposable of disposables) disposable.dispose();
      unsubscribe();
      registration = undefined;
    },
  };
  registration = current;
  return current;
}
