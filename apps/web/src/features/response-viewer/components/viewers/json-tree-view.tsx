"use client";

import { useTranslations } from "next-intl";

import { JsonTree } from "./json-tree";
import { useJsonDocument } from "../../hooks/use-json-document";
import type { ResponseViewerProps } from "../../lib/response-viewers";
import { BodyNotice } from "../body-notice";

/**
 * The tree body view (F-13). Large bodies are parsed in the body worker, which keeps the
 * document; the tree asks it for one level at a time.
 */
export function JsonTreeView({ response }: ResponseViewerProps) {
  const t = useTranslations("responseViewer.tree");
  const state = useJsonDocument(response.body.data);

  switch (state.status) {
    case "parsing":
      return <BodyNotice isStatus>{t("parsing")}</BodyNotice>;
    case "invalid":
      return <BodyNotice>{t("invalid")}</BodyNotice>;
    case "ready":
      return <JsonTree document={state.document} />;
  }
}
