"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ShortcutHint } from "@/components/common/shortcut-hint";
import { RequestIllustration } from "@/components/illustrations/request-illustration";
import { KEYMAP } from "@/config/keymap";

/** Shortcuts listed on the empty editor, with their labels in the `shell.actions` catalog. */
const WELCOME_SHORTCUTS = [
  { binding: KEYMAP.newRequestTab, labelKey: "newRequest" },
  { binding: KEYMAP.toggleSidebar, labelKey: "toggleSidebar" },
  { binding: KEYMAP.toggleConsole, labelKey: "toggleConsole" },
  { binding: KEYMAP.toggleResponsePanel, labelKey: "toggleResponse" },
  { binding: KEYMAP.openSettings, labelKey: "openSettings" },
] as const;

/** Props for {@link EditorWelcome}. */
export type EditorWelcomeProps = { action?: ReactNode };

/** The editor area while no request is open: what goes here, how to start, and shortcuts. */
export function EditorWelcome({ action }: EditorWelcomeProps) {
  const t = useTranslations("shell");

  return (
    <div className="flex h-full flex-col items-center overflow-auto bg-background p-6">
      <div className="my-auto flex w-full flex-col items-center">
        <EmptyState
          illustration={<RequestIllustration />}
          title={t("editor.emptyTitle")}
          description={t("editor.emptyDescription")}
          actions={action}
        />
        <div className="w-full max-w-72">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            {t("editor.shortcutsHeading")}
          </h3>
          <dl className="flex flex-col gap-1.5">
            {WELCOME_SHORTCUTS.map(({ binding, labelKey }) => (
              <div key={binding} className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{t(`actions.${labelKey}`)}</dt>
                <dd>
                  <ShortcutHint binding={binding} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
