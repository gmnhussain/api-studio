import { IllustrationFrame, type IllustrationProps } from "./illustration-frame";

/** A stack of request cards, the top one tagged with a method pill. For an empty collection list. */
export function CollectionsIllustration({ className }: IllustrationProps) {
  return (
    <IllustrationFrame className={className}>
      <rect x="30" y="18" width="62" height="44" rx="7" className="fill-surface" />
      <rect x="24" y="26" width="68" height="48" rx="8" className="fill-surface-raised" />
      <rect x="18" y="34" width="76" height="50" rx="9" className="fill-surface-raised" />
      <rect
        x="27"
        y="45"
        width="18"
        height="9"
        rx="4.5"
        className="fill-primary-muted stroke-primary"
      />
      <path d="M51 49.5h32" />
      <path d="M27 64h48" className="stroke-border" />
      <path d="M27 72h34" className="stroke-border" />
    </IllustrationFrame>
  );
}
