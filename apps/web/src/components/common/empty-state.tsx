import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Props for {@link EmptyState}. */
export type EmptyStateProps = {
  /** A decorative illustration from `components/illustrations`. */
  illustration?: ReactNode;
  title: string;
  /** What goes here and why it is useful (design-system.md#patterns). */
  description: ReactNode;
  /** The next action: usually one primary button, optionally a shortcut hint. */
  actions?: ReactNode;
  /** `compact` for narrow regions such as the sidebar and the console. */
  size?: "default" | "compact";
  className?: string;
};

/**
 * Explains an empty region and offers the next step. Fades in gently, so a region that becomes
 * empty (for example after a delete) changes calmly; reduced motion turns the fade off.
 */
export function EmptyState({
  illustration,
  title,
  description,
  actions,
  size = "default",
  className,
}: EmptyStateProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={cn(
        "flex animate-in flex-col items-center justify-center text-center duration-(--duration-slow) fade-in-0 slide-in-from-bottom-1",
        isCompact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10",
        className,
      )}
    >
      {illustration ? (
        <div className={cn(isCompact ? "mb-1 scale-75" : "mb-2")}>{illustration}</div>
      ) : null}
      <h3 className={cn("font-medium text-foreground", isCompact ? "text-sm" : "text-base")}>
        {title}
      </h3>
      <p
        className={cn(
          "text-balance text-muted-foreground",
          isCompact ? "max-w-56 text-xs" : "max-w-xs text-sm",
        )}
      >
        {description}
      </p>
      {actions ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
