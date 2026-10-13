"use client";

import { createTranslator } from "next-intl";

import { ErrorView } from "@/components/common/error-view";
import { DEFAULT_LOCALE } from "@/i18n/i18n.constants";
import messages from "@/i18n/messages/en.json";
import { fontVariables } from "@/lib/fonts";

import "@/styles/globals.css";

/**
 * Last-resort error boundary for failures in layouts, which replaces the root layout and so has
 * no providers: it translates from the catalog directly and renders its own document, dark like
 * the default appearance.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const t = createTranslator({ locale: DEFAULT_LOCALE, messages, namespace: "errors" });

  return (
    <html lang={DEFAULT_LOCALE} className={`${fontVariables} dark`}>
      <body>
        <ErrorView
          title={t("title")}
          description={t("description")}
          retryLabel={t("retry")}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
