"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useExecutionService, useExecutorPreference, useTabExecution } from "@/features/execution";
import { useTabsStore } from "@/features/tabs";

import { ExecutionErrorView } from "./execution-error-view";
import { ResponseContent } from "./response-content";
import { ResponseSummary } from "./response-summary";

/** Props for {@link ResponseView}. */
export type ResponseViewProps = { emptyState: ReactNode };

/**
 * The response of the active tab (F-11): nothing yet, sending, an explained error, or the
 * response with its summary and sections (F-11–F-16, F-41).
 */
export function ResponseView({ emptyState }: ResponseViewProps) {
  const t = useTranslations("responseViewer");
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const execution = useTabExecution(activeTabId);
  const service = useExecutionService();
  const [, setExecutorId] = useExecutorPreference();
  const isSending = execution?.status === "sending";

  if (!execution || activeTabId === null) return emptyState;
  if (isSending) {
    return (
      <div
        role="status"
        className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
        {t("sending")}
      </div>
    );
  }

  const { result } = execution;
  if (!result) return emptyState;
  if (result.outcome === "error") {
    return (
      <ExecutionErrorView
        error={result.error}
        executorId={execution.executorId}
        onRetry={
          execution.request && service
            ? () => {
                void service.retry(activeTabId);
              }
            : null
        }
        onSwitchExecutor={setExecutorId}
      />
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b px-3 py-2">
        <ResponseSummary response={result.response} />
      </div>
      {/* A new response starts its views afresh: filters, opt-ins and tree state. */}
      <ResponseContent
        key={execution.executionId}
        tabId={activeTabId}
        response={result.response}
        method={result.request.method}
      />
    </div>
  );
}
