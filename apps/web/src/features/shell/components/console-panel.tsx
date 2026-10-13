"use client";

import { PanelBottomClose } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/common/panel";
import { KEYMAP } from "@/config/keymap";

import { SHELL_REGION_IDS } from "../shell.constants";
import { PanelToggleButton } from "./panel-toggle-button";

const CONSOLE_TITLE_ID = "studio-console-title";

/** Props for {@link ConsolePanel}. */
export type ConsolePanelProps = { onHide: () => void };

/** The console region. Shows its empty state until the console feature logs entries (M4). */
export function ConsolePanel({ onHide }: ConsolePanelProps) {
  const t = useTranslations("shell");

  return (
    <Panel id={SHELL_REGION_IDS.console} aria-labelledby={CONSOLE_TITLE_ID}>
      <PanelHeader
        titleId={CONSOLE_TITLE_ID}
        title={t("console.title")}
        actions={
          <PanelToggleButton
            icon={PanelBottomClose}
            label={t("actions.hideConsole")}
            isOpen
            controls={SHELL_REGION_IDS.console}
            binding={KEYMAP.toggleConsole}
            onToggle={onHide}
          />
        }
      />
      <PanelBody className="flex flex-col">
        <EmptyState
          className="my-auto"
          size="compact"
          title={t("console.emptyTitle")}
          description={t("console.emptyDescription")}
        />
      </PanelBody>
    </Panel>
  );
}
