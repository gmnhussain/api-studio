"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Method labels shown in the preview, with their token colour classes. */
const PREVIEW_METHODS = [
  { label: "GET", className: "text-method-get" },
  { label: "POST", className: "text-method-post" },
  { label: "PATCH", className: "text-method-patch" },
  { label: "DEL", className: "text-method-delete" },
] as const;

/**
 * A miniature of the studio drawn from the live tokens, so theme, accent and density changes show
 * immediately. Decorative apart from its heading.
 */
export function AppearancePreview() {
  const t = useTranslations("settings.appearance.preview");

  return (
    <figure className="overflow-hidden rounded-lg border bg-background">
      <figcaption className="border-b bg-surface px-4 py-2 text-xs font-medium text-muted-foreground">
        {t("label")}
      </figcaption>
      <div aria-hidden className="flex">
        <ul className="flex w-40 flex-col gap-0.5 border-r bg-surface p-2">
          {PREVIEW_METHODS.map((method, index) => (
            <li
              key={method.label}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1 text-xs",
                index === 0 && "bg-surface-selected",
              )}
            >
              <span className={cn("w-9 font-mono text-2xs font-semibold", method.className)}>
                {method.label}
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-border" />
            </li>
          ))}
        </ul>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center gap-2 rounded-md border bg-surface px-2 py-1.5 font-mono text-xs">
            <span className="font-semibold text-method-get">GET</span>
            <span className="truncate text-muted-foreground">/users/42</span>
            <Button size="xs" tabIndex={-1} className="ml-auto">
              {t("primaryAction")}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-sm bg-success-muted px-1.5 py-0.5 font-mono text-success">
              200 OK
            </span>
            <span className="text-muted-foreground tabular-nums">142 ms · 3.4 KB</span>
            <Button size="xs" variant="outline" tabIndex={-1} className="ml-auto">
              {t("secondaryAction")}
            </Button>
          </div>
        </div>
      </div>
    </figure>
  );
}
