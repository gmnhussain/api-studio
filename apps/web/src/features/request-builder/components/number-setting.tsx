"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The whole number `text` holds when it is one within `min` and `max`, else `null`. */
function parseWholeNumber(text: string, min: number, max: number): number | null {
  const number = Number(text);
  return text.trim() !== "" && Number.isInteger(number) && number >= min && number <= max
    ? number
    : null;
}

/** Props for {@link NumberSetting}. */
export type NumberSettingProps = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
};

/**
 * A whole-number request setting. Text that is not a whole number in range stays in the field
 * with an error and is not written to the draft, so a saved draft is always valid.
 */
export function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  onValueChange,
}: NumberSettingProps) {
  const t = useTranslations("requestBuilder.settings");
  const id = useId();
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    // The draft changed elsewhere (reload, saved version): show its value.
    setLastValue(value);
    setText(String(value));
  }
  const isValid = parseWholeNumber(text, min, max) !== null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-start gap-x-6 gap-y-1 py-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <div>
        <Input
          id={id}
          inputMode="numeric"
          value={text}
          aria-describedby={`${id}-description${isValid ? "" : ` ${id}-error`}`}
          aria-invalid={!isValid}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            const number = parseWholeNumber(next, min, max);
            if (number !== null) {
              setLastValue(number);
              onValueChange(number);
            }
          }}
          className="font-mono"
        />
        {isValid ? null : (
          <p id={`${id}-error`} className="mt-1 text-xs text-danger">
            {t("outOfRange", { min, max })}
          </p>
        )}
      </div>
    </div>
  );
}
