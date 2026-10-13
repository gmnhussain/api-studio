import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { SETTINGS_SECTIONS, type SettingsSection } from "@/config/routes";
import { AboutSettings, AppearanceSettings } from "@/features/settings";

type SettingsSectionPageProps = { params: Promise<{ section: SettingsSection }> };

/** Each section is prerendered; any other section is a 404. */
export const dynamicParams = false;

/** The settings sections to prerender. */
export function generateStaticParams(): { section: SettingsSection }[] {
  return SETTINGS_SECTIONS.map((section) => ({ section }));
}

/** Page title: the section name. */
export async function generateMetadata({ params }: SettingsSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const t = await getTranslations("settings.sections");
  return { title: t(`${section}.title`) };
}

const SECTION_CONTENT: Readonly<Record<SettingsSection, () => ReactNode>> = {
  appearance: () => <AppearanceSettings />,
  about: () => <AboutSettings />,
};

/** One settings section: its heading, description and controls. */
export default async function SettingsSectionPage({ params }: SettingsSectionPageProps) {
  const { section } = await params;
  const t = await getTranslations("settings.sections");

  return (
    <section aria-labelledby="settings-section-title" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 id="settings-section-title" className="text-xl font-semibold tracking-tight">
          {t(`${section}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">{t(`${section}.description`)}</p>
      </header>
      {SECTION_CONTENT[section]()}
    </section>
  );
}
