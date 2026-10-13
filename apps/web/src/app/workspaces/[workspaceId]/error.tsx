"use client";

import { useTranslations } from "next-intl";

import { ErrorView } from "@/components/common/error-view";

/** Error boundary for the studio: the frame failed, so offer a retry instead of a blank page. */
export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <ErrorView
      title={t("title")}
      description={t("description")}
      retryLabel={t("retry")}
      onRetry={reset}
    />
  );
}
