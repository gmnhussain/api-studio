"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import type { VariableMap } from "@api-studio/core";

import { VariableInput } from "@/components/common/variable-input/variable-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useVariableDetail } from "../../hooks/use-variable-detail";

/** Props for {@link AuthField}. */
export type AuthFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  variables: VariableMap;
  /** Credentials are masked until the user reveals them (rule 7). */
  isSecret?: boolean;
};

/** One labelled auth input; secret ones have a show and hide toggle. */
export function AuthField({
  label,
  value,
  onValueChange,
  variables,
  isSecret = false,
}: AuthFieldProps) {
  const t = useTranslations("requestBuilder.auth");
  const id = useId();
  const renderVariableDetail = useVariableDetail();
  const [isRevealed, setRevealed] = useState(false);

  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <VariableInput
          id={id}
          value={value}
          onValueChange={onValueChange}
          variables={variables}
          renderVariableDetail={renderVariableDetail}
          isMasked={isSecret && !isRevealed}
        />
        {isSecret ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={isRevealed}
            aria-label={isRevealed ? t("hide", { field: label }) : t("show", { field: label })}
            onClick={() => {
              setRevealed((revealed) => !revealed);
            }}
          >
            {isRevealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
