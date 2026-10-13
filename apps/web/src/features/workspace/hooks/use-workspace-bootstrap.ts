"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { loadWorkspaceService } from "../services/load-workspace-service";
import type { WorkspaceService } from "../services/workspace.service";
import { useWorkspaceStore, type WorkspaceLoadStatus } from "../stores/workspace.store";

/** The workspace service once loaded, and where loading the workspace list stands. */
export type WorkspaceBootstrap = {
  service: WorkspaceService | null;
  status: WorkspaceLoadStatus;
};

/**
 * Loads the workspace service after mount and the workspace list into the store, creating the
 * first workspace on first run. Every component may call it; the work happens once.
 */
export function useWorkspaceBootstrap(): WorkspaceBootstrap {
  const t = useTranslations("workspace");
  const defaultName = t("defaultName");
  const [service, setService] = useState<WorkspaceService | null>(null);
  const status = useWorkspaceStore((state) => state.status);

  useEffect(() => {
    let isMounted = true;
    void loadWorkspaceService().then(async (loaded) => {
      if (!isMounted) return;
      setService(loaded);
      await loaded.loadWorkspaces(defaultName);
    });
    return () => {
      isMounted = false;
    };
  }, [defaultName]);

  return { service, status };
}
