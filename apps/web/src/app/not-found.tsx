import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

/** Any unknown URL: say so plainly and lead back to the studio. */
export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <EmptyState
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        actions={
          <Button nativeButton={false} render={<Link href={routes.home()} />}>
            {t("backToStudio")}
          </Button>
        }
      />
    </main>
  );
}
