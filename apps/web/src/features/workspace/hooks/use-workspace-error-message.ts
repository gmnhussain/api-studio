"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { NAME_MAX_LENGTH } from "@api-studio/core";

import type { WorkspaceError } from "../workspace.constants";

/** Turns a {@link WorkspaceError} into the sentence the UI shows for it. */
export function useWorkspaceErrorMessage(): (error: WorkspaceError) => string {
  const t = useTranslations("workspace.errors");
  return useCallback(
    (error: WorkspaceError) =>
      error === "invalid_name" ? t("invalid_name", { max: NAME_MAX_LENGTH }) : t(error),
    [t],
  );
}
