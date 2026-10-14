"use client";

import { ArrowDown } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";

import {
  formatBytes,
  formatDuration,
  getTimelineSegments,
  type HttpMethod,
  type ResponseSnapshot,
  type TimelinePhase,
} from "@api-studio/core";

import { cn } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

/** Bar colours per phase, from the semantic tokens. */
const PHASE_CLASSES: Readonly<Record<TimelinePhase, string>> = {
  waiting: "bg-info",
  download: "bg-success",
};

const PERCENT = 100;

/** Props for {@link ResponseTimeline}. */
export type ResponseTimelineProps = {
  response: ResponseSnapshot;
  /** The method the request was sent with, shown on the first step of the redirect chain. */
  method: HttpMethod;
};

/**
 * Where the time went and how the response was reached (F-41): the measured phases on one axis,
 * the transfer details, and every redirect hop up to the final URL.
 */
export function ResponseTimeline({ response, method }: ResponseTimelineProps) {
  const t = useTranslations("responseViewer.timeline");
  const format = useFormatter();
  const { timings, sizes, redirects } = response;
  const total = timings.totalMilliseconds;
  const segments = getTimelineSegments(timings);
  const headingId = useId();

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-3 text-xs">
      <section aria-labelledby={`${headingId}-phases`} className="flex flex-col gap-2">
        <h3 id={`${headingId}-phases`} className="font-medium text-foreground">
          {t("phases")}
        </h3>
        {segments.length === 0 ? (
          <p className="text-muted-foreground">{t("notMeasured")}</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5">
            {segments.map((segment) => (
              <div key={segment.phase} className="contents">
                <dt className="text-muted-foreground">{t(`phase.${segment.phase}`)}</dt>
                <dd aria-hidden className="relative h-2 rounded-full bg-surface-hover">
                  <span
                    className={cn("absolute inset-y-0 rounded-full", PHASE_CLASSES[segment.phase])}
                    // Each bar sits on the execution's time axis, a position no class can name.
                    style={{
                      left: `${String(total === 0 ? 0 : (segment.offsetMilliseconds / total) * PERCENT)}%`,
                      width: `${String(total === 0 ? 0 : (segment.durationMilliseconds / total) * PERCENT)}%`,
                    }}
                  />
                </dd>
                <dd className="text-end font-mono tabular-nums">
                  {formatDuration(segment.durationMilliseconds)}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className="flex justify-between border-t pt-2 font-medium">
          <span>{t("total")}</span>
          <span className="font-mono tabular-nums">{formatDuration(total)}</span>
        </p>
      </section>

      <section aria-labelledby={`${headingId}-details`}>
        <h3 id={`${headingId}-details`} className="mb-2 font-medium text-foreground">
          {t("details")}
        </h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
          <dt className="text-muted-foreground">{t("startedAt")}</dt>
          <dd className="font-mono tabular-nums">
            {format.dateTime(new Date(timings.startedAt), {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          </dd>
          <dt className="text-muted-foreground">{t("httpVersion")}</dt>
          <dd className="font-mono">{response.httpVersion}</dd>
          <dt className="text-muted-foreground">{t("requestSize")}</dt>
          <dd className="font-mono tabular-nums">{formatBytes(sizes.requestBytes)}</dd>
          <dt className="text-muted-foreground">{t("headersSize")}</dt>
          <dd className="font-mono tabular-nums">{formatBytes(sizes.responseHeadersBytes)}</dd>
          <dt className="text-muted-foreground">{t("bodySize")}</dt>
          <dd className="font-mono tabular-nums">
            {sizes.responseBodyBytes === sizes.decodedBodyBytes
              ? formatBytes(sizes.decodedBodyBytes)
              : t("compressedSize", {
                  transferred: formatBytes(sizes.responseBodyBytes),
                  decoded: formatBytes(sizes.decodedBodyBytes),
                })}
          </dd>
        </dl>
      </section>

      <section aria-labelledby={`${headingId}-redirects`}>
        <h3 id={`${headingId}-redirects`} className="mb-2 font-medium text-foreground">
          {t("redirects", { count: redirects.length })}
        </h3>
        <ol className="flex flex-col gap-1">
          {redirects.map((hop, index) => (
            <li key={`${String(index)}-${hop.url}`} className="flex flex-col gap-1">
              <p className="flex items-start gap-2">
                <StatusBadge status={hop.status} className="shrink-0" />
                <span className="font-mono break-all">
                  {index === 0 ? `${method} ${hop.url}` : hop.url}
                </span>
              </p>
              <p className="ms-2 text-muted-foreground">
                <ArrowDown aria-hidden className="size-3.5" />
                <span className="sr-only">{t("redirectsTo")}</span>
              </p>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <StatusBadge status={response.status} className="shrink-0" />
            <span className="font-mono break-all">
              {redirects.length === 0 ? `${method} ${response.url}` : response.url}
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
