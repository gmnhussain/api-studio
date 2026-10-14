"use client";

import { useTranslations } from "next-intl";

import { HTTP_METHODS, isHttpMethod, type HttpMethod } from "@api-studio/core";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { METHOD_TEXT_CLASSES } from "../lib/method-styles";

/** Props for {@link RequestMethodSelect}. */
export type RequestMethodSelectProps = {
  method: HttpMethod;
  onMethodChange: (method: HttpMethod) => void;
};

/** The colour-coded method picker at the start of the URL bar (F-01). */
export function RequestMethodSelect({ method, onMethodChange }: RequestMethodSelectProps) {
  const t = useTranslations("requestBuilder");

  return (
    <Select
      value={method}
      onValueChange={(value) => {
        if (isHttpMethod(value)) onMethodChange(value);
      }}
    >
      <SelectTrigger
        aria-label={t("urlBar.method", { method })}
        className={cn(
          "h-8 w-24 shrink-0 rounded-r-none border-r-0 font-mono text-xs font-semibold",
          METHOD_TEXT_CLASSES[method],
        )}
      >
        {t(`methods.${method}`)}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" className="w-32">
        {HTTP_METHODS.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className={cn("font-mono text-xs font-semibold", METHOD_TEXT_CLASSES[option])}
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
