import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_NAME } from "@/config/app";
import {
  DEFAULT_APPEARANCE_ATTRIBUTES,
  SettingsBootScript,
  SettingsProvider,
  ThemedToaster,
} from "@/features/settings";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description:
    "A local-first, keyboard-driven workspace for designing, sending and understanding HTTP requests.",
};

/**
 * Root document shared by every route: fonts, locale, message catalog and appearance settings.
 * The server renders the default appearance; the boot script rewrites `<html>` from the saved
 * cookie before the first paint, hence `suppressHydrationWarning` (ADR-0011).
 */
export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn(fontVariables, "dark")}
      {...DEFAULT_APPEARANCE_ATTRIBUTES}
      suppressHydrationWarning
    >
      <head>
        <SettingsBootScript />
      </head>
      <body>
        <NextIntlClientProvider>
          <SettingsProvider>
            <TooltipProvider>
              {children}
              <ThemedToaster />
            </TooltipProvider>
          </SettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
