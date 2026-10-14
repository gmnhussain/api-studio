"use client";

import { useTranslations } from "next-intl";

import {
  formatBytes,
  formatDuration,
  getStatusClass,
  type ResponseSnapshot,
  type StatusClass,
} from "@api-studio/core";

import { cn } from "@/lib/utils";

/** Status colours by class (design-system.md#semantic); the code is always written out too. */
const STATUS_CLASSES: Readonly<Record<StatusClass, string>> = {
  informational: "bg-info-muted text-info",
  success: "bg-success-muted text-success",
  redirection: "bg-info-muted text-info",
  client_error: "bg-warning-muted text-warning",
  server_error: "bg-danger-muted text-danger",
  unknown: "bg-surface-hover text-muted-foreground",
};

/**
 * The status the browser reports for a redirect it was told not to follow: an opaque response
 * that hides the real status and location.
 */
const HIDDEN_REDIRECT_STATUS = 0;

/** Props for {@link ResponseSummary}. */
export type ResponseSummaryProps = { response: ResponseSnapshot };

/** The response's status, time and size (F-11), the first thing read after sending. */
export function ResponseSummary({ response }: ResponseSummaryProps) {
  const t = useTranslations("responseViewer.summary");
  const { status, statusText, timings, sizes, body } = response;

  return (
    <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">{t("status")}</dt>
        <dd
          className={cn(
            "rounded-sm px-1.5 py-0.5 font-mono font-semibold",
            STATUS_CLASSES[getStatusClass(status)],
          )}
        >
          {status === HIDDEN_REDIRECT_STATUS
            ? t("hiddenRedirect")
            : `${String(status)} ${statusText}`}
        </dd>
      </div>
      <div className="flex items-center gap-1">
        <dt className="text-muted-foreground">{t("time")}</dt>
        <dd className="font-mono tabular-nums">{formatDuration(timings.totalMilliseconds)}</dd>
      </div>
      <div className="flex items-center gap-1">
        <dt className="text-muted-foreground">{t("size")}</dt>
        <dd className="font-mono tabular-nums">
          {formatBytes(sizes.responseHeadersBytes + sizes.responseBodyBytes)}
        </dd>
      </div>
      {body.truncated ? (
        <div>
          <dt className="sr-only">{t("note")}</dt>
          <dd className="text-warning">{t("truncated")}</dd>
        </div>
      ) : null}
    </dl>
  );
}
