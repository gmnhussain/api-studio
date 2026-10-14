"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod/mini";

import { nameSchema, type RequestItem, type TabId } from "@api-studio/core";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollectionStore } from "@/features/collections";

import { useRequestBuilderErrorMessage } from "../hooks/use-request-builder-error-message";
import { listSaveLocations } from "../lib/save-locations";
import type { RequestService } from "../services/request.service";

const saveFormSchema = z.object({
  name: nameSchema,
  locationId: z.string(),
  newCollectionName: z.string(),
});
type SaveForm = z.infer<typeof saveFormSchema>;

const NAME_INPUT_ID = "save-request-name";
const LOCATION_LABEL_ID = "save-request-location";
const NEW_COLLECTION_INPUT_ID = "save-request-new-collection";

/** Props for {@link SaveRequestDialog}. */
export type SaveRequestDialogProps = {
  tabId: TabId;
  initialName: string;
  service: RequestService;
  onOpenChange: (isOpen: boolean) => void;
  onSaved: (item: RequestItem) => void;
};

/**
 * Asks where a request saved for the first time goes (layout-and-interaction.md#key-flows): its
 * name and a collection or folder. With no collection yet, it names a new one instead.
 */
export function SaveRequestDialog({
  tabId,
  initialName,
  service,
  onOpenChange,
  onSaved,
}: SaveRequestDialogProps) {
  const t = useTranslations("requestBuilder.saveDialog");
  const errorMessage = useRequestBuilderErrorMessage();
  const collections = useCollectionStore((state) => state.collections);
  const items = useCollectionStore((state) => state.items);
  const locations = listSaveLocations(Object.values(collections), Object.values(items));
  const hasCollections = locations.length > 0;
  const form = useForm<SaveForm>({
    resolver: zodResolver(saveFormSchema),
    defaultValues: {
      name: initialName,
      locationId: locations[0]?.id ?? "",
      newCollectionName: t("newCollectionDefault"),
    },
  });
  const nameError = form.formState.errors.name;

  const submit = form.handleSubmit(async ({ name, locationId, newCollectionName }) => {
    const location = locations.find((option) => option.id === locationId);
    const result = await service.saveAs(tabId, {
      name,
      location: location
        ? { collectionId: location.collectionId, parentId: location.parentId }
        : { newCollectionName },
    });
    if (result.ok) {
      onOpenChange(false);
      onSaved(result.value);
    } else if (result.error === "invalid_name") {
      form.setError("name", { message: errorMessage(result.error) });
    } else {
      toast.error(errorMessage(result.error));
    }
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close")}>
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor={NAME_INPUT_ID}>{t("nameLabel")}</FieldLabel>
            <Input
              id={NAME_INPUT_ID}
              autoComplete="off"
              aria-invalid={nameError ? true : undefined}
              {...form.register("name")}
            />
            {nameError ? <FieldError>{errorMessage("invalid_name")}</FieldError> : null}
          </Field>
          {hasCollections ? (
            <Field>
              <FieldLabel id={LOCATION_LABEL_ID}>{t("locationLabel")}</FieldLabel>
              <Controller
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <Select
                    items={locations.map((location) => ({
                      value: location.id,
                      label: [location.collectionName, ...location.folderPath].join(" / "),
                    }))}
                    value={field.value}
                    onValueChange={(value) => {
                      if (typeof value === "string") field.onChange(value);
                    }}
                  >
                    <SelectTrigger aria-labelledby={LOCATION_LABEL_ID} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} align="start">
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {[location.collectionName, ...location.folderPath].join(" / ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor={NEW_COLLECTION_INPUT_ID}>{t("newCollectionLabel")}</FieldLabel>
              <Input
                id={NEW_COLLECTION_INPUT_ID}
                autoComplete="off"
                {...form.register("newCollectionName")}
              />
              <FieldDescription>{t("newCollectionDescription")}</FieldDescription>
            </Field>
          )}
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
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
