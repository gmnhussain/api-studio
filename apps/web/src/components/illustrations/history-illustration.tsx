import { IllustrationFrame, type IllustrationProps } from "./illustration-frame";

/** A clock beside a list of past requests. For an empty history. */
export function HistoryIllustration({ className }: IllustrationProps) {
  return (
    <IllustrationFrame className={className}>
      <rect x="44" y="22" width="60" height="58" rx="9" className="fill-surface-raised" />
      <path d="M56 38h36" />
      <path d="M56 51h28" className="stroke-border" />
      <path d="M56 64h32" className="stroke-border" />
      <circle cx="36" cy="44" r="20" className="fill-surface" />
      <path d="M36 33v11l7 5" className="stroke-primary" />
    </IllustrationFrame>
  );
}
