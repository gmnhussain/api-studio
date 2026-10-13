"use client";

import { Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { SegmentedControl } from "@/components/common/segmented-control";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useSettings } from "../hooks/use-settings";
import {
  ACCENTS,
  DENSITIES,
  MOTION_PREFERENCES,
  THEME_MODES,
  type Accent,
} from "../settings.constants";
import { AppearancePreview } from "./appearance-preview";
import { SettingRow } from "./setting-row";

const THEME_ICONS = { dark: Moon, light: Sun, system: Monitor } as const;

/** Swatch colour per accent, from the `--swatch-*` tokens. */
const ACCENT_SWATCH_CLASSES: Readonly<Record<Accent, string>> = {
  ion: "bg-swatch-ion",
  iris: "bg-swatch-iris",
  ember: "bg-swatch-ember",
  moss: "bg-swatch-moss",
  graphite: "bg-swatch-graphite",
};

/**
 * The Appearance section: theme, accent, density and motion. Every change applies at once and
 * is saved to the settings cookie, so it also holds after a reload, before the first paint.
 */
export function AppearanceSettings() {
  const t = useTranslations("settings");
  const appearance = useSettings((state) => state.appearance);
  const setAppearance = useSettings((state) => state.setAppearance);
  const resetAppearance = useSettings((state) => state.resetAppearance);

  return (
    <div className="flex flex-col gap-6">
      <AppearancePreview />

      <div className="divide-y">
        <SettingRow
          labelId="setting-theme-label"
          descriptionId="setting-theme-description"
          label={t("appearance.theme.label")}
          description={t("appearance.theme.description")}
        >
          <SegmentedControl
            aria-labelledby="setting-theme-label"
            aria-describedby="setting-theme-description"
            value={appearance.theme}
            onValueChange={(theme) => {
              setAppearance("theme", theme);
            }}
            options={THEME_MODES.map((theme) => {
              const Icon = THEME_ICONS[theme];
              return {
                value: theme,
                label: t(`themes.${theme}`),
                icon: <Icon className="size-3.5" />,
              };
            })}
          />
        </SettingRow>

        <SettingRow
          labelId="setting-accent-label"
          descriptionId="setting-accent-description"
          label={t("appearance.accent.label")}
          description={t("appearance.accent.description")}
        >
          <SegmentedControl
            aria-labelledby="setting-accent-label"
            aria-describedby="setting-accent-description"
            value={appearance.accent}
            onValueChange={(accent) => {
              setAppearance("accent", accent);
            }}
            options={ACCENTS.map((accent) => ({
              value: accent,
              label: t(`accents.${accent}`),
              icon: (
                <span
                  aria-hidden
                  className={cn("size-2.5 rounded-full", ACCENT_SWATCH_CLASSES[accent])}
                />
              ),
            }))}
          />
        </SettingRow>

        <SettingRow
          labelId="setting-density-label"
          descriptionId="setting-density-description"
          label={t("appearance.density.label")}
          description={t("appearance.density.description")}
        >
          <SegmentedControl
            aria-labelledby="setting-density-label"
            aria-describedby="setting-density-description"
            value={appearance.density}
            onValueChange={(density) => {
              setAppearance("density", density);
            }}
            options={DENSITIES.map((density) => ({
              value: density,
              label: t(`densities.${density}`),
            }))}
          />
        </SettingRow>

        <SettingRow
          labelId="setting-motion-label"
          descriptionId="setting-motion-description"
          label={t("appearance.motion.label")}
          description={t("appearance.motion.description")}
        >
          <SegmentedControl
            aria-labelledby="setting-motion-label"
            aria-describedby="setting-motion-description"
            value={appearance.motion}
            onValueChange={(motion) => {
              setAppearance("motion", motion);
            }}
            options={MOTION_PREFERENCES.map((motion) => ({
              value: motion,
              label: t(`motionPreferences.${motion}`),
            }))}
          />
        </SettingRow>
      </div>

      <div>
        <Button variant="outline" size="sm" onClick={resetAppearance}>
          <RotateCcw data-icon="inline-start" />
          {t("appearance.reset")}
        </Button>
      </div>
    </div>
  );
}
