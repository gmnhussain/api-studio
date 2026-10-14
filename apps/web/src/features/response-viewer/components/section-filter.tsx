"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SearchInput } from "@/components/common/search-input";

/** Props for {@link SectionFilter}. */
export type SectionFilterProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** What the filter leaves, e.g. "3 of 12", announced as it changes. */
  summary: ReactNode;
};

/** The filter row above a response table (F-15). */
export function SectionFilter({ value, onValueChange, placeholder, summary }: SectionFilterProps) {
  const t = useTranslations("responseViewer");
  return (
    <div className="flex shrink-0 items-center gap-3 border-b px-3 py-1.5">
      <SearchInput
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        aria-label={placeholder}
        clearLabel={t("clearFilter")}
        className="w-full max-w-64"
      />
      <p aria-live="polite" className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
        {summary}
      </p>
    </div>
  );
}
