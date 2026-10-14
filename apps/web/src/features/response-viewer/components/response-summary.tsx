"use client";

import { useTranslations } from "next-intl";

import { formatBytes, formatDuration, type ResponseSnapshot } from "@api-studio/core";

import { StatusBadge } from "./status-badge";

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
        <dd>
          <StatusBadge
            status={status}
            label={
              status === HIDDEN_REDIRECT_STATUS
                ? t("hiddenRedirect")
                : `${String(status)} ${statusText}`
            }
          />
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
