import type { ReactNode } from "react";

/** Props for {@link BodyNotice}. */
export type BodyNoticeProps = {
  children: ReactNode;
  /** Actions under the message, such as "Format anyway" or "Download". */
  actions?: ReactNode;
  /** Announce the message politely, for work in progress ("Formatting…"). */
  isStatus?: boolean;
};

/** A short message in place of a body view: empty, binary, too large, invalid, in progress. */
export function BodyNotice({ children, actions, isStatus = false }: BodyNoticeProps) {
  return (
    <div
      role={isStatus ? "status" : undefined}
      className="flex flex-col items-start gap-3 p-3 text-sm text-muted-foreground"
    >
      <p>{children}</p>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
