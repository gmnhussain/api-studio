"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { APP_VERSION } from "@/config/app";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

/** Shown until the switch and its menu load: the default executor, at the same size. */
function ExecutorSwitchPlaceholder() {
  const t = useTranslations("shell.statusBar");
  return <span className="flex h-5 items-center px-1">{t("executors.proxy")}</span>;
}

/** The executor switch and its menu library load after the shell paints. */
const ExecutorSwitch = dynamic(
  () => import("@/features/execution").then((module) => module.ExecutorSwitch),
  { ssr: false, loading: ExecutorSwitchPlaceholder },
);

/**
 * The 24 px bar under the studio: connection state and how requests are sent on the left,
 * version on the right. The active environment and the last execution join it later (M6).
 */
export function StatusBar() {
  const t = useTranslations("shell");
  const isOnline = useOnlineStatus();

  return (
    <footer
      aria-label={t("regions.statusBar")}
      className="flex h-6 shrink-0 items-center gap-3 border-t bg-surface px-3 text-2xs text-muted-foreground"
    >
      <span role="status" className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", isOnline ? "bg-success" : "bg-warning")}
        />
        {isOnline ? t("statusBar.online") : t("statusBar.offline")}
      </span>
      <ExecutorSwitch />
      <span className="ml-auto tabular-nums">
        {t("statusBar.version", { version: APP_VERSION })}
      </span>
    </footer>
  );
}
