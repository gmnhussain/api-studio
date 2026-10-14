"use client";

import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/empty-state";

import type { BodyEditorProps } from "../../lib/body-type-views";

/** What the body editor shows without a body, and for binary bodies until file bodies arrive. */
export function BodyNotice({ body }: BodyEditorProps) {
  const t = useTranslations("requestBuilder.body");
  const isBinary = body.type === "binary";

  return (
    <EmptyState
      size="compact"
      title={isBinary ? t("binaryTitle") : t("noneTitle")}
      description={isBinary ? t("binaryDescription") : t("noneDescription")}
    />
  );
}
