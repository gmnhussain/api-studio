"use client";

import { useShallow } from "zustand/react/shallow";

import { ancestorsOf, asId, type AuthConfig, type TabId } from "@api-studio/core";

import { useCollectionStore } from "@/features/collections";
import { useTabsStore } from "@/features/tabs";

/** What a request with `inherit` auth would send, and where that comes from. */
export type InheritedAuth = {
  auth: AuthConfig;
  /** The folder or collection that sets it; `null` when nothing above sets auth. */
  sourceName: string | null;
};

const NO_AUTH: InheritedAuth = { auth: { type: "none" }, sourceName: null };

/**
 * The auth a tab's request inherits (F-07): the nearest parent folder's or the collection's that
 * is not `inherit` itself. A request not saved yet has nothing to inherit from.
 */
export function useInheritedAuth(tabId: TabId): InheritedAuth {
  const entityId = useTabsStore(
    (state) => state.tabs.find((tab) => tab.id === tabId)?.entityId ?? null,
  );
  return useCollectionStore(
    useShallow((state): InheritedAuth => {
      if (entityId === null) return NO_AUTH;
      const itemId = asId<"CollectionItemId">(entityId);
      const item = state.items[itemId];
      const collection = item ? state.collections[item.collectionId] : undefined;
      if (!item || !collection) return NO_AUTH;

      const sources = [
        ...ancestorsOf(Object.values(state.items), itemId).flatMap((ancestor) =>
          ancestor.type === "folder" ? [{ auth: ancestor.auth, sourceName: ancestor.name }] : [],
        ),
        { auth: collection.auth, sourceName: collection.name },
      ];
      return sources.find((source) => source.auth.type !== "inherit") ?? NO_AUTH;
    }),
  );
}
