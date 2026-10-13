"use client";

import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/common/panel";

import { SIDEBAR_SECTION_DEFINITIONS } from "./sidebar-sections";
import { useUi } from "../hooks/use-ui";

const SIDEBAR_TITLE_ID = "studio-sidebar-title";

/**
 * The active sidebar section: its title and content. Shared by the resizable sidebar panel and
 * the overlay sheet used on narrow screens.
 */
export function SidebarContent() {
  const t = useTranslations("shell.sections");
  const section = useUi((state) => state.sidebarSection);
  const { Illustration } = SIDEBAR_SECTION_DEFINITIONS[section];

  return (
    <Panel aria-labelledby={SIDEBAR_TITLE_ID}>
      <PanelHeader titleId={SIDEBAR_TITLE_ID} title={t(`${section}.title`)} />
      <PanelBody className="flex flex-col">
        <EmptyState
          className="my-auto"
          key={section}
          size="compact"
          illustration={<Illustration />}
          title={t(`${section}.emptyTitle`)}
          description={t(`${section}.emptyDescription`)}
        />
      </PanelBody>
    </Panel>
  );
}
