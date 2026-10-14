"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { HttpMethod, ResponseSnapshot, TabId } from "@api-studio/core";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ResponseBody } from "./response-body";
import { ResponseCookies } from "./response-cookies";
import { ResponseHeaders } from "./response-headers";
import { ResponseTimeline } from "./response-timeline";
import {
  DEFAULT_TAB_RESPONSE_VIEW,
  RESPONSE_SECTIONS,
  useResponseViewerStore,
  type ResponseSection,
} from "../stores/response-viewer.store";

function isResponseSection(value: unknown): value is ResponseSection {
  return RESPONSE_SECTIONS.some((section) => section === value);
}

/** A section tab with an optional count, e.g. "Headers 12". */
function SectionTrigger({
  value,
  count,
  children,
}: {
  value: ResponseSection;
  count?: number;
  children: ReactNode;
}) {
  return (
    <TabsTrigger value={value} className="flex-none px-2 text-xs">
      {children}
      {count === undefined ? null : (
        <span className="rounded-sm bg-surface-hover px-1 font-mono text-xs text-muted-foreground">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

/** Props for {@link ResponseContent}. */
export type ResponseContentProps = {
  tabId: TabId;
  response: ResponseSnapshot;
  /** The method the request was sent with. */
  method: HttpMethod;
};

/**
 * The response's sections (F-12–F-15, F-41): body, headers, cookies and timeline. Each tab
 * keeps the section it shows.
 */
export function ResponseContent({ tabId, response, method }: ResponseContentProps) {
  const t = useTranslations("responseViewer");
  const section = useResponseViewerStore(
    (state) => state.views[tabId]?.section ?? DEFAULT_TAB_RESPONSE_VIEW.section,
  );
  const setSection = useResponseViewerStore((state) => state.setSection);

  return (
    <Tabs
      value={section}
      onValueChange={(value) => {
        if (isResponseSection(value)) setSection(tabId, value);
      }}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <TabsList variant="line" aria-label={t("sectionsLabel")} className="shrink-0 border-b px-3">
        <SectionTrigger value="body">{t("sections.body")}</SectionTrigger>
        <SectionTrigger value="headers" count={response.headers.length}>
          {t("sections.headers")}
        </SectionTrigger>
        <SectionTrigger value="cookies" count={response.cookies.length}>
          {t("sections.cookies")}
        </SectionTrigger>
        <SectionTrigger value="timeline">{t("sections.timeline")}</SectionTrigger>
      </TabsList>
      <TabsContent value="body" className="flex min-h-0 flex-1 flex-col">
        <ResponseBody tabId={tabId} response={response} />
      </TabsContent>
      <TabsContent value="headers" className="flex min-h-0 flex-1 flex-col">
        <ResponseHeaders headers={response.headers} />
      </TabsContent>
      <TabsContent value="cookies" className="flex min-h-0 flex-1 flex-col">
        <ResponseCookies cookies={response.cookies} />
      </TabsContent>
      <TabsContent value="timeline" className="min-h-0 flex-1">
        <ResponseTimeline response={response} method={method} />
      </TabsContent>
    </Tabs>
  );
}
