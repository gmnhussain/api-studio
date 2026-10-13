"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod/mini";

import { nameSchema, type Result, type Workspace } from "@api-studio/core";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useWorkspaceErrorMessage } from "../hooks/use-workspace-error-message";
import type { WorkspaceError } from "../workspace.constants";

const workspaceNameFormSchema = z.object({ name: nameSchema });
type WorkspaceNameForm = z.infer<typeof workspaceNameFormSchema>;

const NAME_INPUT_ID = "workspace-name";

/** Marks a field error set from the service, whose message is already translated. */
const SERVICE_ERROR_TYPE = "service";

/** Props for {@link WorkspaceNameDialog}. */
export type WorkspaceNameDialogProps = {
  mode: "create" | "rename";
  /** The current name when renaming. */
  initialName?: string;
  onOpenChange: (isOpen: boolean) => void;
  /** Saves the name; a refused name shows under the field, other failures as a toast. */
  onSubmit: (name: string) => Promise<Result<Workspace, WorkspaceError>>;
  /** Called with the saved workspace, after the dialog closes. */
  onSaved?: (workspace: Workspace) => void;
};

/**
 * The dialog that names a new workspace or renames one. The field validates with the domain's
 * name schema, so the form and the service agree on what a valid name is; schema errors show the
 * catalog's sentence, because Zod's own messages are not translated.
 */
export function WorkspaceNameDialog({
  mode,
  initialName = "",
  onOpenChange,
  onSubmit,
  onSaved,
}: WorkspaceNameDialogProps) {
  const t = useTranslations("workspace.nameDialog");
  const errorMessage = useWorkspaceErrorMessage();
  const form = useForm<WorkspaceNameForm>({
    resolver: zodResolver(workspaceNameFormSchema),
    defaultValues: { name: initialName },
  });
  const nameError = form.formState.errors.name;

  const submit = form.handleSubmit(async ({ name }) => {
    const result = await onSubmit(name);
    if (result.ok) {
      onOpenChange(false);
      onSaved?.(result.value);
    } else if (result.error === "invalid_name") {
      form.setError("name", { type: SERVICE_ERROR_TYPE, message: errorMessage(result.error) });
    } else {
      toast.error(errorMessage(result.error));
    }
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close")}>
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? t("createTitle") : t("renameTitle")}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? t("createDescription") : t("renameDescription")}
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor={NAME_INPUT_ID}>{t("nameLabel")}</FieldLabel>
            <Input
              id={NAME_INPUT_ID}
              autoComplete="off"
              placeholder={t("namePlaceholder")}
              aria-invalid={nameError ? true : undefined}
              {...form.register("name")}
            />
            {nameError ? (
              <FieldError>
                {nameError.type === SERVICE_ERROR_TYPE
                  ? nameError.message
                  : errorMessage("invalid_name")}
              </FieldError>
            ) : null}
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {mode === "create" ? t("create") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
