"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  registerRequestBuilderContributions,
  RequestBuilderProvider,
  useRequestBuilder,
} from "@/features/request-builder";
import { EditorArea } from "@/features/tabs";

import { EditorWelcome } from "./editor-welcome";

registerRequestBuilderContributions();

/** The tab strip's place while tabs are restored, so nothing moves when they appear. */
function EditorAreaSkeleton() {
  return (
    <div aria-hidden className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-surface px-3">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/** The editor area with the request builder's actions. */
function StudioEditorArea() {
  const t = useTranslations("tabs");
  const { service, newRequest } = useRequestBuilder();

  return (
    <EditorArea
      onNewTab={newRequest}
      onReopenClosedTab={() => service?.reopenClosedTab()}
      loadingState={<EditorAreaSkeleton />}
      emptyState={
        <EditorWelcome
          action={
            <Button onClick={newRequest}>
              <Plus aria-hidden />
              {t("newTab")}
            </Button>
          }
        />
      }
    />
  );
}

/**
 * The studio's centre: tabs and request editors (M3). Its code and the IndexedDB session load in
 * their own chunk after the shell has painted (performance.md#strategies).
 */
export function StudioEditor() {
  return (
    <RequestBuilderProvider>
      <StudioEditorArea />
    </RequestBuilderProvider>
  );
}
