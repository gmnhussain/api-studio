import { IllustrationFrame, type IllustrationProps } from "./illustration-frame";

/** A request window with a URL bar and a send arrow. For the empty editor. */
export function RequestIllustration({ className }: IllustrationProps) {
  return (
    <IllustrationFrame className={className}>
      <rect x="12" y="14" width="96" height="68" rx="10" className="fill-surface-raised" />
      <path d="M12 28h96" className="stroke-border" />
      <circle cx="21" cy="21" r="1.5" className="fill-border-strong stroke-none" />
      <circle cx="27" cy="21" r="1.5" className="fill-border-strong stroke-none" />
      <circle cx="33" cy="21" r="1.5" className="fill-border-strong stroke-none" />
      <rect x="22" y="38" width="58" height="12" rx="4" className="fill-surface" />
      <rect x="25" y="41" width="12" height="6" rx="2" className="fill-primary-muted stroke-none" />
      <path d="M42 44h30" className="stroke-border" />
      <rect x="84" y="38" width="16" height="12" rx="4" className="fill-primary stroke-primary" />
      <path d="M89 44h6m-2.5-2.5L95 44l-2.5 2.5" className="stroke-primary-foreground" />
      <path d="M22 60h44" className="stroke-border" />
      <path d="M22 68h30" className="stroke-border" />
    </IllustrationFrame>
  );
}
