import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Props shared by every illustration. */
export type IllustrationProps = { className?: string };

/**
 * The SVG canvas every empty-state illustration draws on: a 120 × 96 view box, decorative
 * (hidden from assistive technology), with token colours so it follows the theme and accent.
 * Strokes default to `--border-strong`; children use `stroke-primary` for the one accent detail.
 */
export function IllustrationFrame({
  className,
  children,
}: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 96"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("h-24 w-30 stroke-border-strong", className)}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
