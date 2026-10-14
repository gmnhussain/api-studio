import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/i18n.constants";
import { englishMessages } from "@/i18n/messages/english-messages";

/** Wraps a component in the providers every feature expects: the message catalog for now. */
function TestProviders({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={englishMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Renders a component the way the app does, so tests query by role and accessible name
 * against real UI text.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, { wrapper: TestProviders, ...options });
}
