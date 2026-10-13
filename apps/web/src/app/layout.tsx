import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import "@/styles/globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "API Studio",
  description:
    "A local-first, keyboard-driven workspace for designing, sending and understanding HTTP requests.",
};

/** Root document shared by every route: fonts, locale and the message catalog. */
export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={cn("font-sans", geistSans.variable)}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
