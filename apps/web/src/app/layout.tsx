import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import "@/styles/globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "API Studio",
  description:
    "A local-first, keyboard-driven workspace for designing, sending and understanding HTTP requests.",
};

/** Root document shared by every route. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable)}>
      <body>{children}</body>
    </html>
  );
}
