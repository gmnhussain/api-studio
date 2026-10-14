"use client";

import { PanelRightClose } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/common/panel";
import { ResponseIllustration } from "@/components/illustrations/response-illustration";
import { KEYMAP } from "@/config/keymap";

import { SHELL_REGION_IDS } from "../shell.constants";
import { PanelToggleButton } from "./panel-toggle-button";

const RESPONSE_TITLE_ID = "studio-response-title";

/** What the response region shows before anything is sent. */
function ResponseEmptyState() {
  const t = useTranslations("shell.response");
  return (
    <EmptyState
      className="my-auto"
      illustration={<ResponseIllustration />}
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    />
  );
}

/**
 * The response view loads after the shell paints, with the body views it registers. Its empty
 * state is also the server HTML and the loading state, so the region does not change when the
 * view arrives.
 */
const ResponseView = dynamic(
  () =>
    import("@/features/response-viewer").then((module) => {
      module.registerResponseViewerContributions();
      return module.ResponseView;
    }),
  { ssr: false, loading: ResponseEmptyState },
);

/** Props for {@link ResponsePanel}. */
export type ResponsePanelProps = { onHide: () => void };

/** The response region: the active tab's response, or its empty state before anything is sent. */
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
        <ResponseView emptyState={<ResponseEmptyState />} />
      </PanelBody>
    </Panel>
  );
}
