"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { loadEnvironmentService } from "@/features/environments";
import { loadExecutionService } from "@/features/execution";
import { useWorkspaceStore } from "@/features/workspace";

import { loadRequestService } from "../services/load-request-service";
import type { RequestService } from "../services/request.service";

/** One toast for repeated auto-save failures, instead of one per attempt. */
const AUTO_SAVE_FAILED_TOAST_ID = "auto-save-failed";

/**
 * Loads the request service after the shell has painted, and restores the open workspace's tabs,
 * drafts, collections, environments and cookie jar whenever the workspace changes. Returns the
 * service once it is loaded.
 */
export function useRequestSession(): RequestService | null {
  const t = useTranslations("requestBuilder.toasts");
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [service, setService] = useState<RequestService | null>(null);
  const autoSaveFailed = t("autoSaveFailed");
  const restoreFailed = t("restoreFailed");

  useEffect(() => {
    let isMounted = true;
    void loadRequestService({
      onSaveFailed: () => toast.error(autoSaveFailed, { id: AUTO_SAVE_FAILED_TOAST_ID }),
    }).then((loaded) => {
      if (isMounted) setService(loaded);
    });
    return () => {
      isMounted = false;
    };
  }, [autoSaveFailed]);

  useEffect(() => {
    if (!service || workspaceId === null) return;
    void service.openWorkspace(workspaceId).then((result) => {
      if (!result.ok) toast.error(restoreFailed);
    });
    void loadEnvironmentService().then((environments) =>
      environments.loadEnvironments(workspaceId),
    );
    void loadExecutionService().then((execution) => execution.openWorkspace(workspaceId));
  }, [service, workspaceId, restoreFailed]);

  return service;
}
