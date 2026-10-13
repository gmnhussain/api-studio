"use client";

import { useTranslations } from "next-intl";

import { APP_VERSION } from "@/config/app";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

/**
 * The 24 px bar under the studio: connection state on the left, version on the right. Executor
 * mode, active environment and the last execution join it with their features.
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
      <span className="ml-auto tabular-nums">
        {t("statusBar.version", { version: APP_VERSION })}
      </span>
    </footer>
  );
}
