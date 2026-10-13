"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { routes, SETTINGS_SECTIONS } from "@/config/routes";
import { cn } from "@/lib/utils";

/**
 * The settings sections as links; the current one is marked with `aria-current="page"`.
 * Horizontal on narrow screens, vertical beside the content from `md` up.
 */
export function SettingsNavigation() {
  const t = useTranslations("settings");
  const pathname = usePathname();

  return (
    <nav aria-label={t("navigation")}>
      <ul className="flex gap-1 md:flex-col">
        {SETTINGS_SECTIONS.map((section) => {
          const href = routes.settings(section);
          const isCurrent = pathname === href;

          return (
            <li key={section}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isCurrent && "bg-surface-selected font-medium text-foreground",
                )}
              >
                {t(`sections.${section}.title`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
