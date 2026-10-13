"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorView } from "@/components/common/error-view";
import { StudioSkeleton } from "@/components/common/studio-skeleton";
import { routes } from "@/config/routes";

import { useWorkspaceBootstrap } from "../hooks/use-workspace-bootstrap";
import { useWorkspaceErrorMessage } from "../hooks/use-workspace-error-message";

/**
 * What `/` renders: loads the workspaces (creating the first on first run) and opens the one
 * used last in this browser. The skeleton matches the studio's, so the hand-off is seamless.
 */
export function OpenLastWorkspace() {
  const t = useTranslations();
  const errorMessage = useWorkspaceErrorMessage();
  const router = useRouter();
  const { service, status } = useWorkspaceBootstrap();

  useEffect(() => {
    if (!service || status !== "ready") return;
    const workspace = service.pickWorkspaceToOpen();
    if (workspace) router.replace(routes.workspace(workspace.id));
  }, [router, service, status]);

  if (status === "failed") {
    return (
      <ErrorView
        title={t("errors.title")}
        description={errorMessage("storage")}
        retryLabel={t("errors.retry")}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }
  return <StudioSkeleton label={t("workspace.opening")} />;
}
