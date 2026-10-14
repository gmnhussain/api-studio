"use client";

import { useTranslations } from "next-intl";

import { useIsDarkTheme } from "@/hooks/use-is-dark-theme";

import { buildHtmlPreviewDocument } from "../../lib/preview-sources";
import type { ResponseViewerProps } from "../../lib/response-viewers";

/**
 * The HTML preview (F-14) in a fully sandboxed frame: no scripts, no forms, no navigation of
 * the app, an opaque origin, and a content security policy that loads nothing from the network
 * (request-execution.md#security). Unstyled pages follow the app's theme.
 */
export function HtmlPreview({ response }: ResponseViewerProps) {
  const t = useTranslations("responseViewer.preview");
  const isDark = useIsDarkTheme();

  return (
    <iframe
      title={t("htmlTitle")}
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={buildHtmlPreviewDocument(response.body.data, isDark ? "dark" : "light")}
      className="size-full border-0 bg-background"
    />
  );
}
