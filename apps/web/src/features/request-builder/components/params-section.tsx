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

/** Props for {@link ParamsSection}. */
export type ParamsSectionProps = {
  request: HttpRequestDefinition;
  editor: DraftEditor;
  variables: VariableMap;
};

/**
 * Query parameters (F-03), in two-way sync with the URL, and the path variables the URL names
 * (F-04). Path variables appear only once the URL has a `:name` segment.
 */
export function ParamsSection({ request, editor, variables }: ParamsSectionProps) {
  const t = useTranslations("requestBuilder.params");
  const labels = useKeyValueLabels();
  const renderVariableDetail = useVariableDetail();

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading title={t("queryTitle")} description={t("queryDescription")} />
        <KeyValueTable
          aria-label={t("queryTitle")}
          entries={request.queryParameters}
          onEntriesChange={editor.setQueryParameters}
          createEntry={() => createKeyValueEntry()}
          variables={variables}
          renderVariableDetail={renderVariableDetail}
          labels={labels}
        />
      </section>
      <section>
        <SectionHeading title={t("pathTitle")} description={t("pathDescription")} />
        {request.pathVariables.length > 0 ? (
          <KeyValueTable
            aria-label={t("pathTitle")}
            entries={request.pathVariables}
            onEntriesChange={editor.setPathVariables}
            createEntry={() => createKeyValueEntry()}
            variables={variables}
            renderVariableDetail={renderVariableDetail}
            labels={labels}
            hasFixedKeys
          />
        ) : null}
      </section>
    </div>
  );
}
