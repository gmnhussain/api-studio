import { cn } from "@/lib/utils";

/** Props for {@link AppLogo}. */
export type AppLogoProps = { className?: string };

/**
 * The API Studio mark: a request arrow out and a response arrow back, on the accent colour, so
 * it follows the accent preset. Decorative; pair it with the product name in text.
 */
export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={cn("size-6 shrink-0", className)}
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="24" height="24" rx="7" className="fill-primary" />
      <path d="M7 9.5h9m-2.5-2.75L16.25 9.5 13.5 12.25" className="stroke-primary-foreground" />
      <path
        d="M17 14.5H8m2.5 2.75L7.75 14.5l2.75-2.75"
        className="stroke-primary-foreground opacity-70"
      />
    </svg>
  );
}
