"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { asId } from "@api-studio/core";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

import { useWorkspaceBootstrap } from "../hooks/use-workspace-bootstrap";
import { useWorkspaceStore } from "../stores/workspace.store";

/** Props for {@link WorkspaceGate}. */
export type WorkspaceGateProps = { children: ReactNode };

/**
 * Shows the studio for the workspace in the URL (`/workspaces/[workspaceId]`), read with
 * `useParams` because the studio lives in the layout above that segment. While workspaces load,
 * the studio renders at once (its data arrives after); once loaded, an unknown id shows a
 * not-found view, and a known one becomes the active workspace and the one `/` reopens next time.
 */
export function WorkspaceGate({ children }: WorkspaceGateProps) {
  const { workspaceId = "" } = useParams<{ workspaceId?: string }>();
  const t = useTranslations("workspace.notFound");
  const { service, status } = useWorkspaceBootstrap();
  const exists = useWorkspaceStore((state) =>
    state.workspaces.some((workspace) => workspace.id === workspaceId),
  );

  useEffect(() => {
    if (!service || status !== "ready") return;
    const id = asId<"WorkspaceId">(workspaceId);
    // A missing workspace must not stay remembered, or `/` would redirect straight back here.
    if (exists) service.openWorkspace(id);
    else service.forgetWorkspace(id);
  }, [service, status, exists, workspaceId]);

  if (status === "ready" && !exists) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <EmptyState
          title={t("title")}
          description={t("description")}
          actions={
            <Button nativeButton={false} render={<Link href={routes.home()} />}>
              {t("action")}
            </Button>
          }
        />
      </main>
    );
  }
  return children;
}
