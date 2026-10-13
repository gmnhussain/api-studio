import { IllustrationFrame, type IllustrationProps } from "./illustration-frame";

/** A response panel waiting for a signal: a status pill and an accent pulse line. */
export function ResponseIllustration({ className }: IllustrationProps) {
  return (
    <IllustrationFrame className={className}>
      <rect x="16" y="16" width="88" height="64" rx="10" className="fill-surface-raised" />
      <rect x="26" y="26" width="24" height="9" rx="4.5" className="fill-surface" />
      <path d="M58 30.5h18" className="stroke-border" />
      <path d="M26 58h14l5-12 7 22 6-16 4 6h32" className="stroke-primary" />
    </IllustrationFrame>
  );
}
