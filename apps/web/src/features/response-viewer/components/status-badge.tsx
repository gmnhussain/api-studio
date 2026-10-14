import { getStatusClass, type StatusClass } from "@api-studio/core";

import { cn } from "@/lib/utils";

/** Status colours by class (design-system.md#semantic); the code is always written out too. */
const STATUS_CLASSES: Readonly<Record<StatusClass, string>> = {
  informational: "bg-info-muted text-info",
  success: "bg-success-muted text-success",
  redirection: "bg-info-muted text-info",
  client_error: "bg-warning-muted text-warning",
  server_error: "bg-danger-muted text-danger",
  unknown: "bg-surface-hover text-muted-foreground",
};

/** Props for {@link StatusBadge}. */
export type StatusBadgeProps = {
  status: number;
  /** What the badge says; the status code when left out. */
  label?: string;
  className?: string;
};

/** An HTTP status, coloured by its class (F-11). */
export function StatusBadge({ status, label = String(status), className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-0.5 font-mono font-semibold",
        STATUS_CLASSES[getStatusClass(status)],
        className,
      )}
    >
      {label}
    </span>
  );
}
