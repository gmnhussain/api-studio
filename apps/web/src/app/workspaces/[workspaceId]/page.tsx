import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** Page title for the studio. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shell.regions");
  return { title: t("workspace") };
}

/**
 * The `[workspaceId]` segment only names the workspace; the studio itself is the parent layout,
 * which reads the id from the URL. Renders nothing of its own.
 */
export default function WorkspacePage() {
  return null;
}
