"use client";

import { useMemo } from "react";

import { asId, mergeVariableScopes, type TabId, type VariableMap } from "@api-studio/core";

import { useCollectionStore } from "@/features/collections";
import { useEnvironmentStore } from "@/features/environments";
import { useTabsStore } from "@/features/tabs";
import { useWorkspaceStore } from "@/features/workspace";

/**
 * The variables a tab's request resolves against (F-28): workspace globals, then its
 * collection's variables, then the active environment's, each overriding the one before. A new
 * request has no collection yet, so only globals and the environment apply.
 */
export function useRequestVariables(tabId: TabId): VariableMap {
  const workspace = useWorkspaceStore((state) =>
    state.workspaces.find((candidate) => candidate.id === state.activeWorkspaceId),
  );
  const entityId = useTabsStore(
    (state) => state.tabs.find((tab) => tab.id === tabId)?.entityId ?? null,
  );
  const collection = useCollectionStore((state) => {
    if (entityId === null) return undefined;
    const item = state.items[asId<"CollectionItemId">(entityId)];
    return item ? state.collections[item.collectionId] : undefined;
  });
  const environment = useEnvironmentStore((state) =>
    state.environments.find((candidate) => candidate.id === workspace?.activeEnvironmentId),
  );

  return useMemo(
    () =>
      mergeVariableScopes({
        global: workspace?.globalVariables ?? [],
        collection: collection?.variables ?? [],
        environment: environment?.variables ?? [],
      }),
    [workspace?.globalVariables, collection?.variables, environment?.variables],
  );
}
