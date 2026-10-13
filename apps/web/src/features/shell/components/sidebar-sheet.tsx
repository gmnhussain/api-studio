"use client";

import { useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { SHELL_REGION_IDS } from "../shell.constants";
import { SidebarContent } from "./sidebar-content";

/** Props for {@link SidebarSheet}. */
export type SidebarSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * The sidebar as an overlay sheet, for screens narrower than 1024 px. Loaded on demand by
 * `AppShell`, so wide screens never download the dialog code.
 */
export function SidebarSheet({ isOpen, onOpenChange }: SidebarSheetProps) {
  const t = useTranslations("shell");

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
  );
}
