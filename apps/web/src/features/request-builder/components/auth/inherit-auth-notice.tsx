"use client";

import { useTranslations } from "next-intl";

import type { AuthFormProps } from "../../lib/auth-scheme-views";

/** Says which folder or collection an `inherit` request takes its auth from, and what it is. */
export function InheritAuthNotice({ inherited }: AuthFormProps) {
  const t = useTranslations("requestBuilder.auth");

  return (
    <p className="rounded-md border bg-surface px-3 py-2 text-sm text-muted-foreground">
      {inherited.sourceName === null
        ? t("inheritedNothing")
        : t("inheritedFrom", {
            source: inherited.sourceName,
            type: t(`types.${inherited.auth.type}`),
          })}
    </p>
  );
}
