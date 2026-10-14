"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { HttpRequestDefinition, KeyValueEntry } from "@api-studio/core";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { REQUEST_SECTIONS, type RequestSection } from "../request-builder.constants";

/** Rows that will be sent: enabled and named. */
function countActive(entries: readonly KeyValueEntry[]): number {
  return entries.filter((entry) => entry.enabled && entry.key !== "").length;
}

/** The count shown on a section tab, or `null` for sections without one. */
function sectionCount(section: RequestSection, request: HttpRequestDefinition): number | null {
  switch (section) {
    case "params":
      return countActive(request.queryParameters) + request.pathVariables.length;
    case "headers":
      return countActive(request.headers);
    case "cookies":
      return countActive(request.cookies);
    case "auth":
    case "body":
    case "settings":
      return null;
  }
}

/** Props for {@link RequestSections}. */
export type RequestSectionsProps = {
  request: HttpRequestDefinition;
  section: RequestSection;
  onSectionChange: (section: RequestSection) => void;
  /** The content of each section; only the active one is rendered. */
  panels: Readonly<Record<RequestSection, ReactNode>>;
};

/** The section tabs under the URL bar, with counts of what each section sends. */
export function RequestSections({
  request,
  section,
  onSectionChange,
  panels,
}: RequestSectionsProps) {
  const t = useTranslations("requestBuilder.sections");

  return (
    <Tabs
      value={section}
      onValueChange={(value) => {
        const next = REQUEST_SECTIONS.find((candidate) => candidate === value);
        if (next) onSectionChange(next);
      }}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <TabsList variant="line" aria-label={t("label")} className="shrink-0 border-b px-3">
        {REQUEST_SECTIONS.map((candidate) => {
          const count = sectionCount(candidate, request);
          return (
            <TabsTrigger key={candidate} value={candidate} className="flex-none px-2 text-xs">
              {t(candidate)}
              {count ? (
                <span className="rounded-sm bg-surface-hover px-1 font-mono text-xs text-muted-foreground">
                  <span aria-hidden>{count}</span>
                  <span className="sr-only">{t("count", { count })}</span>
                </span>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {REQUEST_SECTIONS.map((candidate) => (
        <TabsContent key={candidate} value={candidate} className="min-h-0 flex-1 overflow-auto p-3">
          {candidate === section ? panels[candidate] : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
