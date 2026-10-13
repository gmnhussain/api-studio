import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A labelled region of the studio (sidebar section, response, console). Renders a `<section>`
 * named by its header, so each region is a landmark screen-reader users can jump to.
 */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("flex h-full min-h-0 flex-col bg-surface", className)} {...props} />
  );
}

/** Props for {@link PanelHeader}. */
export type PanelHeaderProps = {
  title: string;
  /** Id for the heading; pass the same value to the panel's `aria-labelledby`. */
  titleId: string;
  /** Toolbar buttons at the end of the header. */
  actions?: ReactNode;
  className?: string;
};

/** The header row of a {@link Panel}: a small heading and an optional toolbar. */
export function PanelHeader({ title, titleId, actions, className }: PanelHeaderProps) {
  return (
    <header className={cn("flex h-9 shrink-0 items-center gap-2 border-b px-3", className)}>
      <h2 id={titleId} className="truncate text-xs font-medium text-muted-foreground">
        {title}
      </h2>
      {actions ? <div className="ml-auto flex items-center gap-0.5">{actions}</div> : null}
    </header>
  );
}

/** The scrollable body of a {@link Panel}. */
export function PanelBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-auto", className)} {...props} />;
}
