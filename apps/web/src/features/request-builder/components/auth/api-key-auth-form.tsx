"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { API_KEY_PLACEMENTS } from "@api-studio/core";

import { SegmentedControl } from "@/components/common/segmented-control";

import { AuthField } from "./auth-field";
import type { AuthFormProps } from "../../lib/auth-scheme-views";

/** An API key sent as a header or a query parameter. */
export function ApiKeyAuthForm({ auth, onAuthChange, variables }: AuthFormProps) {
  const t = useTranslations("requestBuilder.auth");
  const placementLabelId = useId();
  if (auth.type !== "api_key") return null;

  return (
    <>
      <AuthField
        label={t("key")}
        value={auth.key}
        onValueChange={(key) => {
          onAuthChange({ ...auth, key });
        }}
        variables={variables}
      />
      <AuthField
        label={t("value")}
        value={auth.value}
        onValueChange={(value) => {
          onAuthChange({ ...auth, value });
        }}
        variables={variables}
        isSecret
      />
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3">
        <span id={placementLabelId} className="text-xs text-muted-foreground">
          {t("placement")}
        </span>
        <SegmentedControl
          aria-labelledby={placementLabelId}
          value={auth.placement}
          onValueChange={(placement) => {
            onAuthChange({ ...auth, placement });
          }}
          options={API_KEY_PLACEMENTS.map((placement) => ({
            value: placement,
            label: t(`placements.${placement}`),
          }))}
          className="w-fit"
        />
      </div>
    </>
  );
}
