"use client";

import { useTranslations } from "next-intl";

import {
  createKeyValueEntry,
  type HttpRequestDefinition,
  type VariableMap,
} from "@api-studio/core";

import { KeyValueTable } from "@/components/common/key-value-table/key-value-table";

import { SectionHeading } from "./section-heading";
import type { DraftEditor } from "../hooks/use-draft";
import { useKeyValueLabels } from "../hooks/use-key-value-labels";
import { useVariableDetail } from "../hooks/use-variable-detail";

/** Props for {@link CookiesSection}. */
export type CookiesSectionProps = {
  request: HttpRequestDefinition;
  editor: DraftEditor;
  variables: VariableMap;
};

/**
 * Cookies written for this request (F-06), sent in its Cookie header. Cookies the workspace's
 * cookie jar collects from responses join them with the execution engine (M4).
 */
export function CookiesSection({ request, editor, variables }: CookiesSectionProps) {
  const t = useTranslations("requestBuilder.cookies");
  const labels = useKeyValueLabels();
  const renderVariableDetail = useVariableDetail();

  return (
    <section>
      <SectionHeading title={t("title")} description={t("description")} />
      <KeyValueTable
        aria-label={t("title")}
        entries={request.cookies}
        onEntriesChange={editor.setCookies}
        createEntry={() => createKeyValueEntry()}
        variables={variables}
        renderVariableDetail={renderVariableDetail}
        labels={labels}
      />
    </section>
  );
}
