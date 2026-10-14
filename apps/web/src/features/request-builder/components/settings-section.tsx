"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import {
  MAX_REDIRECTS_LIMIT,
  MAX_TIMEOUT_MILLISECONDS,
  type RequestSettings,
} from "@api-studio/core";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { NumberSetting } from "./number-setting";

/** The shortest timeout the field accepts. */
const MIN_TIMEOUT_MILLISECONDS = 1;

/** Props for {@link SettingsSection}. */
export type SettingsSectionProps = {
  settings: RequestSettings;
  onSettingsChange: (settings: RequestSettings) => void;
};

/** Per-request transport settings (F-09): timeout, following redirects and their limit. */
export function SettingsSection({ settings, onSettingsChange }: SettingsSectionProps) {
  const t = useTranslations("requestBuilder.settings");
  const followId = useId();

  return (
    <div className="max-w-2xl divide-y">
      <NumberSetting
        label={t("timeout")}
        description={t("timeoutDescription")}
        value={settings.timeoutMilliseconds}
        min={MIN_TIMEOUT_MILLISECONDS}
        max={MAX_TIMEOUT_MILLISECONDS}
        onValueChange={(timeoutMilliseconds) => {
          onSettingsChange({ ...settings, timeoutMilliseconds });
        }}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-x-6 py-3">
        <div>
          <Label htmlFor={followId}>{t("followRedirects")}</Label>
          <p id={`${followId}-description`} className="text-xs text-muted-foreground">
            {t("followRedirectsDescription")}
          </p>
        </div>
        <Switch
          id={followId}
          aria-describedby={`${followId}-description`}
          checked={settings.followRedirects}
          onCheckedChange={(followRedirects) => {
            onSettingsChange({ ...settings, followRedirects });
          }}
        />
      </div>
      <NumberSetting
        label={t("maxRedirects")}
        description={t("maxRedirectsDescription")}
        value={settings.maxRedirects}
        min={0}
        max={MAX_REDIRECTS_LIMIT}
        onValueChange={(maxRedirects) => {
          onSettingsChange({ ...settings, maxRedirects });
        }}
      />
    </div>
  );
}
