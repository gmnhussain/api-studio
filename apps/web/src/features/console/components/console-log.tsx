"use client";

import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

import { formatDuration } from "@api-studio/core";

import { cn } from "@/lib/utils";

import { CONSOLE_LEVELS, type ConsoleLevel } from "../console.constants";
import { useConsoleStore, type ConsoleEntry } from "../stores/console.store";

const LEVEL_ICONS = { info: Info, warning: TriangleAlert, error: CircleAlert } as const;
const LEVEL_CLASSES: Readonly<Record<ConsoleLevel, string>> = {
  info: "text-muted-foreground",
  warning: "text-warning",
  error: "text-danger",
};
/** Scrolled within this many pixels of the end (a few rows) counts as following new entries. */
const FOLLOW_THRESHOLD_PIXELS = 96;

/** Props for {@link ConsoleLog}. */
export type ConsoleLogProps = { emptyState: ReactNode };

/**
 * The console's entries (layout-and-interaction.md#shell), newest at the bottom. It follows new
 * entries while scrolled to the end, and stays put while the user reads older ones.
 */
export function ConsoleLog({ emptyState }: ConsoleLogProps) {
  const t = useTranslations("console");
  const errorsT = useTranslations("executionErrors");
  const format = useFormatter();
  const entries = useConsoleStore((state) => state.entries);
  const minimumLevel = useConsoleStore((state) => state.minimumLevel);
  const listRef = useRef<HTMLOListElement>(null);
  const shown = entries.filter(
    (entry) => CONSOLE_LEVELS.indexOf(entry.level) >= CONSOLE_LEVELS.indexOf(minimumLevel),
  );

  useEffect(() => {
    const list = listRef.current?.parentElement;
    if (!list) return;
    const distanceFromEnd = list.scrollHeight - list.scrollTop - list.clientHeight;
    if (distanceFromEnd < FOLLOW_THRESHOLD_PIXELS) list.scrollTop = list.scrollHeight;
  }, [shown.length]);

  if (shown.length === 0) return emptyState;

  const describe = (entry: ConsoleEntry): string => {
    if (entry.kind === "message") return entry.message;
    const { method, url, status, totalMilliseconds, errorCode } = entry.execution;
    const outcome =
      errorCode !== null ? errorsT(`${errorCode}.label`) : status === null ? "" : String(status);
    const duration = totalMilliseconds === null ? "" : ` (${formatDuration(totalMilliseconds)})`;
    return `${method} ${url} → ${outcome}${duration}`;
  };

  return (
    <ol ref={listRef} role="log" aria-label={t("logLabel")} className="font-mono text-xs">
      {shown.map((entry) => {
        const Icon = LEVEL_ICONS[entry.level];
        return (
          <li key={entry.id} className="flex items-start gap-2 border-b px-3 py-1 last:border-b-0">
            <Icon
              aria-hidden
              className={cn("mt-0.5 size-3.5 shrink-0", LEVEL_CLASSES[entry.level])}
            />
            <span className="sr-only">{t(`levels.${entry.level}`)}</span>
            <time dateTime={entry.at} className="shrink-0 text-muted-foreground tabular-nums">
              {format.dateTime(new Date(entry.at), { timeStyle: "medium" })}
            </time>
            <span className="min-w-0 break-all">{describe(entry)}</span>
          </li>
        );
      })}
    </ol>
  );
}
