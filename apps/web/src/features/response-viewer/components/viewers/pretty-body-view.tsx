"use client";

import { useTranslations } from "next-intl";

import { BodyText } from "./body-text";
import { usePrettyBody } from "../../hooks/use-pretty-body";
import { editorLanguageFor } from "../../lib/editor-language";
import type { ResponseViewerProps } from "../../lib/response-viewers";
import { BodyNotice } from "../body-notice";

/**
 * The pretty body view (F-12): JSON and XML formatted, every text format highlighted. Large
 * bodies are formatted in the body worker while the page stays responsive.
 */
export function PrettyBodyView({ response, format }: ResponseViewerProps) {
  const t = useTranslations("responseViewer.body");
  const pretty = usePrettyBody(format, response.body.data);

  if (pretty.status === "formatting") {
    return <BodyNotice isStatus>{t("formatting")}</BodyNotice>;
  }
  return (
    <BodyText
      text={pretty.text}
      language={editorLanguageFor(format)}
      aria-label={t("prettyLabel")}
    />
  );
}
