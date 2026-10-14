"use client";

import { useTranslations } from "next-intl";

import { createKeyValueEntry } from "@api-studio/core";

import { KeyValueTable } from "@/components/common/key-value-table/key-value-table";

import { useKeyValueLabels } from "../../hooks/use-key-value-labels";
import { useVariableDetail } from "../../hooks/use-variable-detail";
import { createFormDataEntry } from "../../lib/body-conversion";
import type { BodyEditorProps } from "../../lib/body-type-views";

/** The fields of a multipart or URL-encoded form body. */
export function FormBodyEditor({ body, onBodyChange, variables }: BodyEditorProps) {
  const t = useTranslations("requestBuilder.body");
  const labels = useKeyValueLabels();
  const renderVariableDetail = useVariableDetail();

  if (body.type === "form_data") {
    return (
      <KeyValueTable
        aria-label={t("formTitle")}
        entries={body.entries}
        onEntriesChange={(entries) => {
          onBodyChange({ ...body, entries });
        }}
        createEntry={() => createFormDataEntry()}
        variables={variables}
        renderVariableDetail={renderVariableDetail}
        labels={labels}
      />
    );
  }
  if (body.type === "url_encoded") {
    return (
      <KeyValueTable
        aria-label={t("formTitle")}
        entries={body.entries}
        onEntriesChange={(entries) => {
          onBodyChange({ ...body, entries });
        }}
        createEntry={() => createKeyValueEntry()}
        variables={variables}
        renderVariableDetail={renderVariableDetail}
        labels={labels}
      />
    );
  }
  return null;
}
