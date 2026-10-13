import type { ReactNode } from "react";

import { AppShell, UiStoreProvider } from "@/features/shell";
import { readUiState } from "@/features/shell/server";
import { WorkspaceGate } from "@/features/workspace";

/**
 * The studio frame for every workspace. It lives above the `[workspaceId]` segment, so switching
 * workspaces keeps the shell, its panels and menus mounted instead of rebuilding them. The saved
 * panel layout is read from its cookie on the server, so the first frame already has the saved
 * shape (ADR-0011); the workspace's data loads in the browser, where it lives (ADR-0002).
 */
export default async function WorkspacesLayout({ children }: { children: ReactNode }) {
  const initialUiState = await readUiState();

  return (
    <WorkspaceGate>
      <UiStoreProvider initialState={initialUiState}>
        <AppShell />
        {children}
      </UiStoreProvider>
    </WorkspaceGate>
  );
}
