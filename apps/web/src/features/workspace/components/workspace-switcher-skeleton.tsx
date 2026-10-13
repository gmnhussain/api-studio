"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for the workspace menu while its code and the workspace list load. */
export function WorkspaceSwitcherSkeleton() {
  const t = useTranslations("workspace.switcher");
  return (
    <span role="status" aria-label={t("loading")} className="flex h-7 items-center px-2.5">
      <Skeleton className="h-4 w-28" />
    </span>
  );
}
