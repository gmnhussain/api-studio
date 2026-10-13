"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type RefObject } from "react";
import { usePanelRef, type PanelImperativeHandle } from "react-resizable-panels";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { KEYMAP } from "@/config/keymap";
import { routes } from "@/config/routes";
import { MEDIA_QUERIES } from "@/constants/breakpoints";
import { useHotkey } from "@/hooks/use-hotkey";
import { useMediaQuery } from "@/hooks/use-media-query";

import { useUi } from "../hooks/use-ui";
import { PANELS, SHELL_REGION_IDS, type SidebarSectionId } from "../shell.constants";
import { ActivityRail } from "./activity-rail";
import { SidebarContent } from "./sidebar-content";
import { StatusBar } from "./status-bar";
import { TopBar, type RegionToggles } from "./top-bar";
import { Workbench } from "./workbench";
import { isPanelCollapsed } from "../stores/ui.store";

/** Collapses an expanded panel or expands a collapsed one. */
function togglePanel(panelRef: RefObject<PanelImperativeHandle | null>): void {
  const panel = panelRef.current;
  if (!panel) return;
  if (panel.isCollapsed()) panel.expand();
  else panel.collapse();
}

/**
 * The studio frame (docs/design/layout-and-interaction.md#shell): top bar, activity rail,
 * resizable workbench and status bar, plus the shortcuts that show and hide regions.
 *
 * Interaction model: the rail picks the sidebar section; picking the open section closes the
 * sidebar. On wide screens the sidebar is a resizable, collapsible panel; below 1024 px it opens
 * as an overlay sheet. Open state is read from the saved layout (collapsed panels have size 0),
 * so buttons, the rail and `aria-expanded` always agree with what is on screen.
 */
export function AppShell() {
  const t = useTranslations("shell");
  const router = useRouter();
  const hasOverlaySidebar = useMediaQuery(MEDIA_QUERIES.overlaySidebar);
  const isStacked = useMediaQuery(MEDIA_QUERIES.stackedEditors);
  const sidebarPanelRef = usePanelRef();
  const consolePanelRef = usePanelRef();
  const responsePanelRef = usePanelRef();
  const [isSidebarSheetOpen, setSidebarSheetOpen] = useState(false);

  const layouts = useUi((state) => state.layouts);
  const sidebarSection = useUi((state) => state.sidebarSection);
  const setSidebarSection = useUi((state) => state.setSidebarSection);
  const editorsGroup = isStacked ? "editors-vertical" : "editors-horizontal";

  const isSidebarOpen = hasOverlaySidebar
    ? isSidebarSheetOpen
    : !isPanelCollapsed(layouts, "workbench", PANELS.sidebar);

  const toggleSidebar = () => {
    if (hasOverlaySidebar) setSidebarSheetOpen((open) => !open);
    else togglePanel(sidebarPanelRef);
  };

  const selectSection = (section: SidebarSectionId) => {
    if (isSidebarOpen && section === sidebarSection) {
      toggleSidebar();
      return;
    }
    setSidebarSection(section);
    if (hasOverlaySidebar) setSidebarSheetOpen(true);
    else sidebarPanelRef.current?.expand();
  };

  const regions: RegionToggles = {
    isSidebarOpen,
    isConsoleOpen: !isPanelCollapsed(layouts, "center", PANELS.console),
    isResponseOpen: !isPanelCollapsed(layouts, editorsGroup, PANELS.response),
    toggleSidebar,
    toggleConsole: () => {
      togglePanel(consolePanelRef);
    },
    toggleResponse: () => {
      togglePanel(responsePanelRef);
    },
  };

  useHotkey(KEYMAP.toggleSidebar, regions.toggleSidebar);
  useHotkey(KEYMAP.toggleConsole, regions.toggleConsole);
  useHotkey(KEYMAP.toggleResponsePanel, regions.toggleResponse);
  useHotkey(KEYMAP.openSettings, () => {
    router.push(routes.settings());
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <TopBar regions={regions} />
      <div className="flex min-h-0 flex-1">
        <ActivityRail
          activeSection={sidebarSection}
          isSidebarOpen={isSidebarOpen}
          onSelectSection={selectSection}
        />
        <Workbench
          hasSidebarPanel={!hasOverlaySidebar}
          isStacked={isStacked}
          sidebarPanelRef={sidebarPanelRef}
          consolePanelRef={consolePanelRef}
          responsePanelRef={responsePanelRef}
        />
      </div>
      <StatusBar />

      {hasOverlaySidebar ? (
        <Sheet open={isSidebarSheetOpen} onOpenChange={setSidebarSheetOpen}>
          <SheetContent
            id={SHELL_REGION_IDS.sidebar}
            side="left"
            closeLabel={t("actions.closeSidebar")}
            className="w-80 gap-0 p-0"
          >
            <SheetTitle className="sr-only">{t("regions.sidebar")}</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
