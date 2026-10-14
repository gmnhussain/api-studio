"use client";

import { useTranslations } from "next-intl";

import { BodyText } from "./body-text";
import type { ResponseViewerProps } from "../../lib/response-viewers";

/** The raw body view (F-12): the text exactly as received, unhighlighted. */
export function RawBodyView({ response }: ResponseViewerProps) {
  const t = useTranslations("responseViewer.body");
  return <BodyText text={response.body.data} language="plaintext" aria-label={t("rawLabel")} />;
}
