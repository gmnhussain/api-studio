"use client";

import { useTranslations } from "next-intl";
import type { RefObject } from "react";

import type { HttpMethod, VariableMap } from "@api-studio/core";

import { VariableInput } from "@/components/common/variable-input/variable-input";

import { RequestMethodSelect } from "./request-method-select";
import { useVariableDetail } from "../hooks/use-variable-detail";

/** Props for {@link RequestUrlBar}. */
export type RequestUrlBarProps = {
  method: HttpMethod;
  url: string;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  variables: VariableMap;
  /** The URL input, focused by `Mod+L`. */
  urlInputRef: RefObject<HTMLInputElement | null>;
};

/**
 * The request's first row: method and URL (F-01, F-02). The URL is monospace, highlights its
 * `{{variables}}` and keeps the query parameter and path variable tables in step as it changes.
 * Sending arrives with the execution engine (M4).
 */
export function RequestUrlBar({
  method,
  url,
  onMethodChange,
  onUrlChange,
  variables,
  urlInputRef,
}: RequestUrlBarProps) {
  const t = useTranslations("requestBuilder.urlBar");
  const renderVariableDetail = useVariableDetail();

  return (
    <div className="flex min-w-0 flex-1">
      <RequestMethodSelect method={method} onMethodChange={onMethodChange} />
      <VariableInput
        inputRef={urlInputRef}
        value={url}
        onValueChange={onUrlChange}
        variables={variables}
        renderVariableDetail={renderVariableDetail}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        className="rounded-l-none"
      />
    </div>
  );
}
