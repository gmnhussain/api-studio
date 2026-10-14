"use client";

import { useTranslations } from "next-intl";

import type { TabViewProps } from "@/features/tabs";
import { cn } from "@/lib/utils";

import { useDraft, useDraftStatus } from "../hooks/use-draft";
import { METHOD_TEXT_CLASSES } from "../lib/method-styles";

/**
 * A request tab in the strip: its method, name and a dot while it has unsaved changes. Pinned
 * tabs show only the method; their full name, with pinned and unsaved states, is still read out.
 */
export function RequestTabLabel({ tab }: TabViewProps) {
  const t = useTranslations("requestBuilder");
  const draft = useDraft(tab.id);
  const { isDirty } = useDraftStatus(tab.id);
  const method = draft?.request.method ?? "GET";
  const name = draft?.name ?? t("untitled");

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {/* One string for assistive technology: separate pieces would be joined with stray spaces. */}
      <span className="sr-only">
        {t("tabName", { method, name, pinned: String(tab.isPinned), dirty: String(isDirty) })}
      </span>
      <span
        aria-hidden
        className={cn("shrink-0 font-mono text-xs font-semibold", METHOD_TEXT_CLASSES[method])}
      >
        {t(`methods.${method}`)}
      </span>
      {tab.isPinned ? null : (
        <span aria-hidden className="truncate">
          {name}
        </span>
      )}
      {isDirty ? (
        <span
          aria-hidden
          data-slot="dirty-indicator"
          className="size-1.5 shrink-0 rounded-full bg-warning"
        />
      ) : null}
    </span>
  );
}
