"use client";

import * as m from "motion/react-m";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CONCEPT_ICONS } from "@/config/icons";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

import { SHELL_REGION_IDS, SIDEBAR_SECTIONS, type SidebarSectionId } from "../shell.constants";
import { SIDEBAR_SECTION_DEFINITIONS } from "./sidebar-sections";

/** Props for {@link ActivityRail}. */
export type ActivityRailProps = {
  activeSection: SidebarSectionId;
  isSidebarOpen: boolean;
  /** Selecting the open section closes the sidebar; any other section opens it. */
  onSelectSection: (section: SidebarSectionId) => void;
};

const INDICATOR_TRANSITION = { type: "spring", stiffness: 500, damping: 40 } as const;

/**
 * The 48 px column of section toggles (Collections, History, Environments, Variables) with
 * Settings at the bottom. Each toggle reports `aria-pressed` and controls the sidebar; the
 * active one carries an accent bar that slides between items.
 */
export function ActivityRail({ activeSection, isSidebarOpen, onSelectSection }: ActivityRailProps) {
  const t = useTranslations("shell");
  const SettingsIcon = CONCEPT_ICONS.settings;

  return (
    <nav
      aria-label={t("regions.activityRail")}
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-surface py-2"
    >
      {SIDEBAR_SECTIONS.map((section) => {
        const Icon = SIDEBAR_SECTION_DEFINITIONS[section].icon;
        const isSelected = isSidebarOpen && section === activeSection;
        const label = t(`sections.${section}.title`);

        return (
          <Tooltip key={section}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={label}
                  aria-pressed={isSelected}
                  aria-controls={SHELL_REGION_IDS.sidebar}
                  onClick={() => {
                    onSelectSection(section);
                  }}
                  className={cn(
                    "relative text-muted-foreground hover:text-foreground",
                    isSelected && "text-foreground",
                  )}
                />
              }
            >
              {isSelected ? (
                <m.span
                  layoutId="activity-rail-indicator"
                  transition={INDICATOR_TRANSITION}
                  className="absolute top-1.5 -left-2 h-5 w-0.5 rounded-full bg-primary"
                />
              ) : null}
              <Icon className="size-5" strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label={t("actions.openSettings")}
              className="mt-auto text-muted-foreground hover:text-foreground"
              render={<Link href={routes.settings()} />}
            />
          }
        >
          <SettingsIcon className="size-5" strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent side="right">{t("actions.openSettings")}</TooltipContent>
      </Tooltip>
    </nav>
  );
}
