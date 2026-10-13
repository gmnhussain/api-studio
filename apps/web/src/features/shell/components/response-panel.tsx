"use client";

import { PanelRightClose } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/common/panel";
import { ResponseIllustration } from "@/components/illustrations/response-illustration";
import { KEYMAP } from "@/config/keymap";

import { SHELL_REGION_IDS } from "../shell.constants";
import { PanelToggleButton } from "./panel-toggle-button";

const RESPONSE_TITLE_ID = "studio-response-title";

/** Props for {@link ResponsePanel}. */
export type ResponsePanelProps = { onHide: () => void };

/** The response region. Shows its empty state until requests can be sent (milestone M4). */
export function ResponsePanel({ onHide }: ResponsePanelProps) {
  const t = useTranslations("shell");

  return (
    <Panel id={SHELL_REGION_IDS.response} aria-labelledby={RESPONSE_TITLE_ID}>
      <PanelHeader
        titleId={RESPONSE_TITLE_ID}
        title={t("response.title")}
        actions={
          <PanelToggleButton
            icon={PanelRightClose}
            label={t("actions.hideResponse")}
            isOpen
            controls={SHELL_REGION_IDS.response}
            binding={KEYMAP.toggleResponsePanel}
            onToggle={onHide}
          />
        }
      />
      <PanelBody className="flex flex-col">
        <EmptyState
          className="my-auto"
          illustration={<ResponseIllustration />}
          title={t("response.emptyTitle")}
          description={t("response.emptyDescription")}
        />
      </PanelBody>
    </Panel>
  );
}
