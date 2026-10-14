"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/** Props for {@link ConflictNotice}. */
export type ConflictNoticeProps = { onReload: () => void; onKeep: () => void };

/**
 * Shown when a request was saved elsewhere while this tab has its own changes
 * (state-management.md#cross-tab-consistency): the user picks a version instead of one silently
 * overwriting the other.
 */
export function ConflictNotice({ onReload, onKeep }: ConflictNoticeProps) {
  const t = useTranslations("requestBuilder.conflict");

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-warning-muted px-3 py-2 text-sm"
    >
      <TriangleAlert aria-hidden className="size-4 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{t("title")}</p>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onReload}>
          {t("reload")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onKeep}>
          {t("keep")}
        </Button>
      </div>
    </div>
  );
}
