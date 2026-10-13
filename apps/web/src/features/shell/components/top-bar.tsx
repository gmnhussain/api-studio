"use client";

import { PanelBottom, PanelLeft, PanelRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppLogo } from "@/components/common/app-logo";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/config/app";
import { KEYMAP } from "@/config/keymap";
import { ThemeSwitcher } from "@/features/settings";
import { WorkspaceSwitcher } from "@/features/workspace";

import { SHELL_REGION_IDS } from "../shell.constants";
import { PanelToggleButton } from "./panel-toggle-button";

/** Open state and toggles of the three collapsible regions. */
export type RegionToggles = {
  isSidebarOpen: boolean;
  isConsoleOpen: boolean;
  isResponseOpen: boolean;
  toggleSidebar: () => void;
  toggleConsole: () => void;
  toggleResponse: () => void;
};

/**
 * The 44 px bar above the studio: the product mark and the workspace switcher on the left, and
 * on the right the layout toggles (sidebar, console, response) and the theme switcher. The
 * command palette and the environment selector join it in later milestones.
 */
export function TopBar({ regions }: { regions: RegionToggles }) {
  const t = useTranslations("shell.actions");

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-surface px-3">
      <div className="flex items-center gap-2">
        <AppLogo className="size-5" />
        <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        <Separator orientation="vertical" className="mx-1.5 h-4" />
        <WorkspaceSwitcher />
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <PanelToggleButton
          icon={PanelLeft}
          label={regions.isSidebarOpen ? t("hideSidebar") : t("showSidebar")}
          isOpen={regions.isSidebarOpen}
          controls={SHELL_REGION_IDS.sidebar}
          binding={KEYMAP.toggleSidebar}
          onToggle={regions.toggleSidebar}
        />
        <PanelToggleButton
          icon={PanelBottom}
          label={regions.isConsoleOpen ? t("hideConsole") : t("showConsole")}
          isOpen={regions.isConsoleOpen}
          controls={SHELL_REGION_IDS.console}
          binding={KEYMAP.toggleConsole}
          onToggle={regions.toggleConsole}
        />
        <PanelToggleButton
          icon={PanelRight}
          label={regions.isResponseOpen ? t("hideResponse") : t("showResponse")}
          isOpen={regions.isResponseOpen}
          controls={SHELL_REGION_IDS.response}
          binding={KEYMAP.toggleResponsePanel}
          onToggle={regions.toggleResponse}
        />
        <Separator orientation="vertical" className="mx-1.5 h-4" />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
