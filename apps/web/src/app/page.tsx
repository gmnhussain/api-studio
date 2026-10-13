import { getTranslations } from "next-intl/server";

import { HTTP_METHODS } from "@api-studio/core";

/** Temporary landing page until the studio shell replaces it in milestone M1. */
export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm opacity-70">{t("status", { methods: HTTP_METHODS.join(", ") })}</p>
    </main>
  );
}
