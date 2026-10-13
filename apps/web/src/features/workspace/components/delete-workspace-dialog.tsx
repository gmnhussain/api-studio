"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import type { Result, Workspace } from "@api-studio/core";

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

import { useWorkspaceErrorMessage } from "../hooks/use-workspace-error-message";
import type { WorkspaceError } from "../workspace.constants";

/** Props for {@link DeleteWorkspaceDialog}. */
export type DeleteWorkspaceDialogProps = {
  workspace: Workspace;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => Promise<Result<null, WorkspaceError>>;
  /** Called after the workspace is gone, for example to open another one. */
  onDeleted?: () => void;
};

/**
 * Confirms deleting a workspace. Deleting cannot be undone, so the dialog names the workspace
 * and what goes with it (design-system.md#patterns, destructive actions).
 */
export function DeleteWorkspaceDialog({
  workspace,
  onOpenChange,
  onConfirm,
  onDeleted,
}: DeleteWorkspaceDialogProps) {
  const t = useTranslations("workspace");
  const errorMessage = useWorkspaceErrorMessage();
  const [isDeleting, setIsDeleting] = useState(false);

  const confirm = async () => {
    setIsDeleting(true);
    const result = await onConfirm();
    setIsDeleting(false);
    onOpenChange(false);
    if (result.ok) {
      toast.success(t("toasts.deleted", { name: workspace.name }));
      onDeleted?.();
    } else {
      toast.error(errorMessage(result.error));
    }
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title", { name: workspace.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void confirm()}
          >
            {t("deleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
