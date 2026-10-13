"use client";

import dynamic from "next/dynamic";

import { useSettings } from "../hooks/use-settings";

/** Toasts appear only after an action, so their code loads after the first paint. */
const Toaster = dynamic(() => import("@/components/ui/sonner").then((module) => module.Toaster), {
  ssr: false,
});

/** The app's toast container, following the current colour scheme. */
export function ThemedToaster() {
  const resolvedTheme = useSettings((state) => state.resolvedTheme);
  return <Toaster theme={resolvedTheme} position="bottom-right" />;
}
