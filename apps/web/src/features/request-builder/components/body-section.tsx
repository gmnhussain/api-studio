"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import type { RequestBody, VariableMap } from "@api-studio/core";

import { SegmentedControl } from "@/components/common/segmented-control";

import { bodyTypeViews } from "../lib/body-type-views";

/** Props for {@link BodySection}. */
export type BodySectionProps = {
  body: RequestBody;
  onBodyChange: (body: RequestBody) => void;
  variables: VariableMap;
};

/**
 * The body editor (F-08): a body type switch and the editor that type contributes. Switching
 * keeps what still fits (text between JSON, text and XML; fields between the two form types).
 */
export function BodySection({ body, onBodyChange, variables }: BodySectionProps) {
  const t = useTranslations("requestBuilder.body");
  const typeLabelId = useId();
  const types = bodyTypeViews.list();
  const Editor = bodyTypeViews.get(body.type)?.Editor ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3 overflow-x-auto">
        <span id={typeLabelId} className="sr-only">
          {t("typeLabel")}
        </span>
        <SegmentedControl
          aria-labelledby={typeLabelId}
          value={body.type}
          onValueChange={(type) => {
            const view = types.find((candidate) => candidate.id === type);
            if (view) onBodyChange(view.convert(body));
          }}
          options={types.map((type) => ({ value: type.id, label: t(`types.${type.id}`) }))}
        />
      </div>
      <div className="min-h-0 flex-1">
        {Editor ? <Editor body={body} onBodyChange={onBodyChange} variables={variables} /> : null}
      </div>
    </div>
  );
}
