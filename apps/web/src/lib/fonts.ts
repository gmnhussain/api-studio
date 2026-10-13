import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

/** Class names that define the font CSS variables used by the Tailwind theme (`font-sans`, `font-mono`). */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
