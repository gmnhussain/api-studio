"use client";

import { useTranslations } from "next-intl";

import {
  COMMON_REQUEST_HEADERS,
  createKeyValueEntry,
  generatedHeaders,
  type AuthConfig,
  type HttpRequestDefinition,
  type VariableMap,
} from "@api-studio/core";

import { KeyValueTable } from "@/components/common/key-value-table/key-value-table";

import { SectionHeading } from "./section-heading";
import type { DraftEditor } from "../hooks/use-draft";
import { useKeyValueLabels } from "../hooks/use-key-value-labels";
import { useVariableDetail } from "../hooks/use-variable-detail";

/** How generated credential values are shown: never in clear text (rule 7). */
const MASKED_VALUE = "••••••••";

/** Props for {@link HeadersSection}. */
export type HeadersSectionProps = {
  request: HttpRequestDefinition;
  /** The auth that applies, `inherit` already resolved. */
  effectiveAuth: AuthConfig;
  editor: DraftEditor;
  variables: VariableMap;
};

/**
 * The user's headers with name autocomplete (F-05), followed by the headers API Studio adds on
 * send (Content-Type from the body, the auth header), read-only and overridden by any header of
 * the same name above.
 */
export function HeadersSection({ request, effectiveAuth, editor, variables }: HeadersSectionProps) {
  const t = useTranslations("requestBuilder.headers");
  const labels = useKeyValueLabels();
  const renderVariableDetail = useVariableDetail();
  const generated = generatedHeaders({
    headers: request.headers,
    body: request.body,
    auth: effectiveAuth,
  });

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading title={t("title")} />
        <KeyValueTable
          aria-label={t("title")}
          entries={request.headers}
          onEntriesChange={editor.setHeaders}
          createEntry={() => createKeyValueEntry()}
          variables={variables}
          keySuggestions={COMMON_REQUEST_HEADERS}
          renderVariableDetail={renderVariableDetail}
          labels={labels}
        />
      </section>
      {generated.length > 0 ? (
        <section aria-labelledby="generated-headers-title">
          <SectionHeading
            id="generated-headers-title"
            title={t("generatedTitle")}
            description={t("generatedDescription")}
          />
          <dl className="divide-y rounded-md border text-sm">
            {generated.map((header) => (
              <div
                key={header.name}
                className="grid grid-cols-[1fr_2fr_auto] items-center gap-3 px-3.5 py-1.5"
              >
                <dt className="truncate font-mono">{header.name}</dt>
                <dd className="truncate font-mono text-muted-foreground">
                  {header.isSecret ? MASKED_VALUE : header.value}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {header.source === "body" ? t("fromBody") : t("fromAuth")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
