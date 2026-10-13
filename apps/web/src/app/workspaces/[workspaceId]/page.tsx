import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AppShell, readUiState, UiStoreProvider } from "@/features/shell";

/** Page title for the studio. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shell.regions");
  return { title: t("workspace") };
}

/**
 * The studio. Reads the saved panel layout from its cookie on the server, so the first frame
 * already has the saved shape (ADR-0011); everything inside is a client island.
 */
export default async function WorkspacePage() {
  const initialUiState = await readUiState();

  return (
    <UiStoreProvider initialState={initialUiState}>
      <AppShell />
    </UiStoreProvider>
  );
}
