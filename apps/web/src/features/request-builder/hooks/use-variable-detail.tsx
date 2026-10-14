"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { CompletionOption } from "@/components/common/variable-input/input-completion";

type VariableOption = Extract<CompletionOption, { kind: "variable" }>;

/**
 * Renders the detail of a variable in the `{{` popup: its value (secrets stay hidden, rule 7)
 * and the scope it comes from.
 */
export function useVariableDetail(): (option: VariableOption) => ReactNode {
  const t = useTranslations("requestBuilder.variables");
  return function renderVariableDetail({ variable }: VariableOption) {
    return (
      <>
        <span className="max-w-40 truncate font-mono">
          {variable.isSecret ? t("secret") : variable.value}
        </span>
        <span className="shrink-0 rounded-sm bg-surface-hover px-1">
          {t(`scopes.${variable.scope}`)}
        </span>
      </>
    );
  };
}
