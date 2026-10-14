import type { Disposable } from "@api-studio/core";

import { useCollectionStore } from "@/features/collections";
import { tabViews } from "@/features/tabs";

import { BUILT_IN_AUTH_SCHEMES } from "./components/auth/built-in-auth-schemes";
import { BUILT_IN_BODY_TYPES } from "./components/body/built-in-body-types";
import { RequestEditor } from "./components/request-editor";
import { RequestTabLabel } from "./components/request-tab-label";
import { authSchemeViews } from "./lib/auth-scheme-views";
import { bodyTypeViews } from "./lib/body-type-views";
import { isDraftDirty } from "./lib/draft-status";
import { savedRequestOf } from "./lib/restore-session";
import { useRequestStore } from "./stores/request.store";

let registration: Disposable | undefined;

/**
 * Registers what the request builder contributes (extensibility.md#registries): the `request` tab
 * view, the built-in auth schemes and the built-in body types. Calling it again while registered
 * returns the same registration.
 *
 * @param untitledName The title of a request whose draft is not loaded.
 */
export function registerRequestBuilderContributions({
  untitledName,
}: {
  untitledName: string;
}): Disposable {
  if (registration) return registration;
  const disposables = [
    tabViews.register({
      id: "request",
      Label: RequestTabLabel,
      Editor: RequestEditor,
      getTitle: (tab) => useRequestStore.getState().drafts[tab.id]?.name ?? untitledName,
      isDirty: (tab) => {
        const draft = useRequestStore.getState().drafts[tab.id];
        const saved = savedRequestOf(tab, useCollectionStore.getState().items);
        return draft ? isDraftDirty(draft, saved) : false;
      },
    }),
    ...BUILT_IN_AUTH_SCHEMES.map((scheme) => authSchemeViews.register(scheme)),
    ...BUILT_IN_BODY_TYPES.map((type) => bodyTypeViews.register(type)),
  ];
  const current: Disposable = {
    dispose: () => {
      for (const disposable of disposables) disposable.dispose();
      registration = undefined;
    },
  };
  registration = current;
  return current;
}
