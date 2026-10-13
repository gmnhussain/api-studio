import { IllustrationFrame, type IllustrationProps } from "./illustration-frame";

/** Three stacked stages (local, staging, production), one marked active. For no environments. */
export function EnvironmentsIllustration({ className }: IllustrationProps) {
  return (
    <IllustrationFrame className={className}>
      <rect x="22" y="16" width="76" height="18" rx="6" className="fill-surface" />
      <rect
        x="22"
        y="39"
        width="76"
        height="18"
        rx="6"
        className="fill-surface-raised stroke-primary"
      />
      <rect x="22" y="62" width="76" height="18" rx="6" className="fill-surface" />
      <circle cx="33" cy="25" r="3" className="stroke-border" />
      <circle cx="33" cy="48" r="3" className="fill-primary stroke-primary" />
      <circle cx="33" cy="71" r="3" className="stroke-border" />
      <path d="M42 25h26" className="stroke-border" />
      <path d="M42 48h34" />
      <path d="M42 71h20" className="stroke-border" />
    </IllustrationFrame>
  );
}
