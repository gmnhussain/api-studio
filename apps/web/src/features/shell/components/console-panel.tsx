"use client";

import { PanelBottomClose } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/common/panel";
import { KEYMAP } from "@/config/keymap";

import { SHELL_REGION_IDS } from "../shell.constants";
import { PanelToggleButton } from "./panel-toggle-button";

const CONSOLE_TITLE_ID = "studio-console-title";

/** What the console shows before anything is logged. */
function ConsoleEmptyState() {
  const t = useTranslations("shell.console");
  return (
    <EmptyState
      className="my-auto"
      size="compact"
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    />
  );
}

/** The log and its tools load after the shell paints; the empty state is the server HTML. */
const ConsoleLog = dynamic(() => import("@/features/console").then((module) => module.ConsoleLog), {
  ssr: false,
  loading: ConsoleEmptyState,
});
const ConsoleToolbar = dynamic(
  () => import("@/features/console").then((module) => module.ConsoleToolbar),
  { ssr: false },
);

/** Props for {@link ConsolePanel}. */
export type ConsolePanelProps = { onHide: () => void };

/** The console region: execution logs and app events, filtered by level. */
export function ConsolePanel({ onHide }: ConsolePanelProps) {
  const t = useTranslations("shell");

  return (
    <Panel id={SHELL_REGION_IDS.console} aria-labelledby={CONSOLE_TITLE_ID}>
      <PanelHeader
        titleId={CONSOLE_TITLE_ID}
        title={t("console.title")}
        actions={
          <>
            <ConsoleToolbar />
            <PanelToggleButton
              icon={PanelBottomClose}
              label={t("actions.hideConsole")}
              isOpen
              controls={SHELL_REGION_IDS.console}
              binding={KEYMAP.toggleConsole}
              onToggle={onHide}
            />
          </>
        }
      />
      <PanelBody className="flex flex-col">
        <ConsoleLog emptyState={<ConsoleEmptyState />} />
      </PanelBody>
    </Panel>
  );
}
