"use client";

import { useTranslations } from "next-intl";

import { formatBytes, type ResponseSnapshot } from "@api-studio/core";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Props for {@link ResponseContent}. */
export type ResponseContentProps = { response: ResponseSnapshot };

/**
 * The response body and headers. Text bodies show as received; pretty printing, the JSON tree and
 * previews arrive with the response viewers (M5).
 */
export function ResponseContent({ response }: ResponseContentProps) {
  const t = useTranslations("responseViewer");
  const { body, headers } = response;

  return (
    <Tabs defaultValue="body" className="flex min-h-0 flex-1 flex-col gap-0">
      <TabsList variant="line" aria-label={t("sectionsLabel")} className="shrink-0 border-b px-3">
        <TabsTrigger value="body" className="flex-none px-2 text-xs">
          {t("sections.body")}
        </TabsTrigger>
        <TabsTrigger value="headers" className="flex-none px-2 text-xs">
          {t("sections.headers")}
          <span className="rounded-sm bg-surface-hover px-1 font-mono text-xs text-muted-foreground">
            {headers.length}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="body" className="min-h-0 flex-1 overflow-auto">
        {body.encoding === "text" ? (
          body.data === "" ? (
            <p className="p-3 text-sm text-muted-foreground">{t("emptyBody")}</p>
          ) : (
            <pre className="p-3 font-mono text-xs break-all whitespace-pre-wrap">{body.data}</pre>
          )
        ) : (
          <p className="p-3 text-sm text-muted-foreground">
            {t("binaryBody", {
              type: body.contentType ?? t("unknownType"),
              size: formatBytes(response.sizes.decodedBodyBytes),
            })}
          </p>
        )}
      </TabsContent>
      <TabsContent value="headers" className="min-h-0 flex-1 overflow-auto">
        <dl className="divide-y font-mono text-xs">
          {headers.map((header, index) => (
            <div
              key={`${header.name}-${String(index)}`}
              className="grid grid-cols-[minmax(8rem,1fr)_2fr] gap-3 px-3 py-1.5"
            >
              <dt className="break-all text-muted-foreground">{header.name}</dt>
              <dd className="break-all">{header.value}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>
    </Tabs>
  );
}
