import { useTranslations } from "next-intl";

import { AppLogo } from "@/components/common/app-logo";
import { APP_NAME, APP_VERSION } from "@/config/app";

/** The About section: product, version, licence and where data is stored. */
export function AboutSettings() {
  const t = useTranslations("settings.about");

  const facts = [
    { term: t("version"), detail: <span className="font-mono tabular-nums">{APP_VERSION}</span> },
    { term: t("license"), detail: t("licenseValue") },
    { term: t("storage"), detail: t("storageValue") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <AppLogo className="size-12" />
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
          <p className="max-w-md text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
      </div>
      <dl className="divide-y rounded-lg border bg-surface">
        {facts.map((fact) => (
          <div key={fact.term} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="text-sm font-medium">{fact.term}</dt>
            <dd className="text-sm text-muted-foreground">{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
