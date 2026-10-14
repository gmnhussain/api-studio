"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { NAME_MAX_LENGTH } from "@api-studio/core";

import type { RequestBuilderError } from "../request-builder.constants";

/** Turns a {@link RequestBuilderError} into the sentence the UI shows for it. */
export function useRequestBuilderErrorMessage(): (error: RequestBuilderError) => string {
  const t = useTranslations("requestBuilder.errors");
  return useCallback(
    (error: RequestBuilderError) =>
      error === "invalid_name" ? t("invalid_name", { max: NAME_MAX_LENGTH }) : t(error),
    [t],
  );
}
