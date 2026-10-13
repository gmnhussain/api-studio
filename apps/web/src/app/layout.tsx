import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "API Studio",
  description:
    "A local-first, keyboard-driven workspace for designing, sending and understanding HTTP requests.",
};

/** Root document shared by every route. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
