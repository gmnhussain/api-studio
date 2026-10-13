"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useSettings } from "../hooks/use-settings";
import { THEME_MODES } from "../settings.constants";

/**
 * Cycles the theme: dark → light → system. The icon is chosen by CSS from the `<html>`
 * attributes the boot script sets, so it is right on the first frame, before hydration.
 */
export function ThemeSwitcher() {
  const t = useTranslations("settings");
  const theme = useSettings((state) => state.appearance.theme);
  const setAppearance = useSettings((state) => state.setAppearance);
  const label = t("themeSwitcher.label", { theme: t(`themes.${theme}`) });

  const switchTheme = () => {
    const next = THEME_MODES[(THEME_MODES.indexOf(theme) + 1) % THEME_MODES.length];
    if (next) setAppearance("theme", next);
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={switchTheme} />}
      >
        <Monitor className="hidden theme-system:block" />
        <Moon className="hidden dark:block theme-system:hidden" />
        <Sun className="block dark:hidden theme-system:hidden" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
