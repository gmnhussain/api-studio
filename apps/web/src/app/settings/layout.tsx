import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_WORKSPACE_ID } from "@/config/app";
import { routes } from "@/config/routes";
import { SettingsNavigation } from "@/features/settings";

/** The settings page frame: a way back to the studio, section navigation and a readable column. */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("settings");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-8">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={routes.workspace(DEFAULT_WORKSPACE_ID)} />}
          >
            <ArrowLeft data-icon="inline-start" />
            {t("backToStudio")}
          </Button>
        </div>
      </header>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 md:flex-row md:gap-12">
        <aside className="md:w-48 md:shrink-0">
          <h1 className="mb-4 text-xl font-semibold tracking-tight">{t("title")}</h1>
          <SettingsNavigation />
        </aside>
        <main className="max-w-180 min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
