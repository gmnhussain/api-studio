import type { ReactNode } from "react";

/** Props for {@link SettingRow}. */
export type SettingRowProps = {
  /** Id of the label; pass it to the control's `aria-labelledby`. */
  labelId: string;
  label: string;
  description: string;
  /** Id of the description; pass it to the control's `aria-describedby`. */
  descriptionId: string;
  children: ReactNode;
};

/**
 * One setting: label and description on the left, the control on the right (stacked on narrow
 * screens). The ids let the control name and describe itself from the visible text.
 */
export function SettingRow({
  labelId,
  label,
  description,
  descriptionId,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex max-w-sm flex-col gap-1">
        <span id={labelId} className="text-sm font-medium text-foreground">
          {label}
        </span>
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
