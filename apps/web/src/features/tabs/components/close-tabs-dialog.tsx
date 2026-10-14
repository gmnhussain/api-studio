"use client";

import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Props for {@link CloseTabsDialog}. */
export type CloseTabsDialogProps = {
  /** How many of the closing tabs have unsaved changes. */
  dirtyCount: number;
  /** The title of the dirty tab, when there is one. */
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirms closing tabs whose unsaved changes would be lost. */
export function CloseTabsDialog({ dirtyCount, title, onConfirm, onCancel }: CloseTabsDialogProps) {
  const t = useTranslations("tabs.closeDialog");

  return (
    <AlertDialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { count: dirtyCount, title })}</AlertDialogTitle>
          <AlertDialogDescription>{t("description", { count: dirtyCount })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
