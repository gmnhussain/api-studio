"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import type { Layout, LayoutChangedMeta, PanelImperativeHandle } from "react-resizable-panels";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { useUi } from "../hooks/use-ui";
import { PANEL_SIZES, PANELS, SHELL_REGION_IDS, type PanelGroupId } from "../shell.constants";
import { ConsolePanel } from "./console-panel";
import { ResponsePanel } from "./response-panel";
import { SidebarContent } from "./sidebar-content";

/** Tabs and editors load after the shell has painted; the region stays empty meanwhile. */
const StudioEditor = dynamic(
  () => import("./studio-editor").then((module) => module.StudioEditor),
  { ssr: false },
);

/** Props for {@link Workbench}. */
export type WorkbenchProps = {
  /** `false` on narrow screens, where the sidebar opens as a sheet instead. */
  hasSidebarPanel: boolean;
  /** Stack the response under the request editor instead of beside it. */
  isStacked: boolean;
  sidebarPanelRef: RefObject<PanelImperativeHandle | null>;
  consolePanelRef: RefObject<PanelImperativeHandle | null>;
  responsePanelRef: RefObject<PanelImperativeHandle | null>;
};

/**
 * The resizable panel layout: sidebar | (editors / console), where editors are request | response
 * (or stacked). Each group starts from the layout saved in the UI store, which the server read
 * from the cookie, and saves the layout the user asked for when a resize ends.
 */
export function Workbench({
  hasSidebarPanel,
  isStacked,
  sidebarPanelRef,
  consolePanelRef,
  responsePanelRef,
}: WorkbenchProps) {
  const t = useTranslations("shell.actions");
  const regionsT = useTranslations("shell.regions");
  const layouts = useUi((state) => state.layouts);
  const setLayout = useUi((state) => state.setLayout);
  const editorsGroup: PanelGroupId = isStacked ? "editors-vertical" : "editors-horizontal";

  const saveLayout = (groupId: PanelGroupId) => (layout: Layout, meta: LayoutChangedMeta) => {
    setLayout(groupId, meta.requestedLayout ?? layout);
  };

  const center = (
    <ResizablePanelGroup
      id="center"
      orientation="vertical"
      defaultLayout={layouts.center}
      onLayoutChanged={saveLayout("center")}
    >
      <ResizablePanel id={PANELS.editors} minSize={160}>
        <ResizablePanelGroup
          key={editorsGroup}
          id={editorsGroup}
          orientation={isStacked ? "vertical" : "horizontal"}
          defaultLayout={layouts[editorsGroup]}
          onLayoutChanged={saveLayout(editorsGroup)}
        >
          <ResizablePanel
            id={PANELS.request}
            {...(isStacked ? PANEL_SIZES.stackedRequest : PANEL_SIZES.request)}
          >
            <section aria-label={regionsT("editor")} className="h-full">
              <StudioEditor />
            </section>
          </ResizablePanel>
          <ResizableHandle aria-label={t("resizeResponse")} />
          <ResizablePanel
            id={PANELS.response}
            panelRef={responsePanelRef}
            collapsible
            collapsedSize={0}
            {...(isStacked ? PANEL_SIZES.stackedResponse : PANEL_SIZES.response)}
          >
            <ResponsePanel onHide={() => responsePanelRef.current?.collapse()} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle aria-label={t("resizeConsole")} />
      <ResizablePanel
        id={PANELS.console}
        panelRef={consolePanelRef}
        collapsible
        collapsedSize={0}
        {...PANEL_SIZES.console}
      >
        <ConsolePanel onHide={() => consolePanelRef.current?.collapse()} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  if (!hasSidebarPanel) return <div className="min-w-0 flex-1">{center}</div>;

  return (
    <ResizablePanelGroup
      id="workbench"
      orientation="horizontal"
      defaultLayout={layouts.workbench}
      onLayoutChanged={saveLayout("workbench")}
      className="min-w-0 flex-1"
    >
      <ResizablePanel
        id={PANELS.sidebar}
        panelRef={sidebarPanelRef}
        collapsible
        collapsedSize={0}
        {...PANEL_SIZES.sidebar}
      >
        <div id={SHELL_REGION_IDS.sidebar} className="h-full border-r">
          <SidebarContent />
        </div>
      </ResizablePanel>
      <ResizableHandle aria-label={t("resizeSidebar")} />
      <ResizablePanel id={PANELS.center}>{center}</ResizablePanel>
    </ResizablePanelGroup>
  );
}
