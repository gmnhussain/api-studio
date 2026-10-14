"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ExecutionError, ExecutorId } from "@api-studio/core";

import { Button } from "@/components/ui/button";

/** Errors that browser mode can get around (it sends from this machine, without the proxy). */
const BROWSER_MODE_HELPS: ReadonlySet<ExecutionError["code"]> = new Set([
  "BLOCKED_ADDRESS",
  "PROXY_UNAVAILABLE",
]);

/** Props for {@link ExecutionErrorView}. */
export type ExecutionErrorViewProps = {
  error: ExecutionError;
  executorId: ExecutorId;
  /** `null` when there is nothing to retry (the request was never built). */
  onRetry: (() => void) | null;
  onSwitchExecutor: (executorId: ExecutorId) => void;
};

/**
 * Explains why an execution produced no response, with the next step for each error code
 * (request-execution.md#executor-contract), and keeps the technical detail one click away.
 */
export function ExecutionErrorView({
  error,
  executorId,
  onRetry,
  onSwitchExecutor,
}: ExecutionErrorViewProps) {
  const t = useTranslations("executionErrors");
  const viewerT = useTranslations("responseViewer.error");
  const action = t(`${error.code}.action`);
  const suggestsBrowser = executorId === "proxy" && BROWSER_MODE_HELPS.has(error.code);
  const suggestsProxy = executorId === "browser" && error.code === "NETWORK";

  return (
    <div role="alert" className="flex flex-col gap-3 p-4 text-sm">
      <div className="flex items-start gap-2">
        <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">{t(`${error.code}.title`)}</p>
          <p className="text-muted-foreground">{t(`${error.code}.description`)}</p>
          {action === "" ? null : <p className="text-muted-foreground">{action}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-6">
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCw aria-hidden />
            {viewerT("retry")}
          </Button>
        ) : null}
        {suggestsBrowser ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onSwitchExecutor("browser");
            }}
          >
            {viewerT("useBrowser")}
          </Button>
        ) : null}
        {suggestsProxy ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onSwitchExecutor("proxy");
            }}
          >
            {viewerT("useProxy")}
          </Button>
        ) : null}
      </div>
      {error.message === "" ? null : (
        <details className="pl-6 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">{viewerT("details")}</summary>
          <p className="mt-1 font-mono break-all">{error.message}</p>
        </details>
      )}
    </div>
  );
}
