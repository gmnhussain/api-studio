import { IllustrationFrame, type IllustrationProps } from "./illustration-frame";

/** Double braces around a value, the `{{variable}}` syntax. For no variables. */
export function VariablesIllustration({ className }: IllustrationProps) {
  return (
    <IllustrationFrame className={className}>
      <rect x="16" y="28" width="88" height="40" rx="10" className="fill-surface-raised" />
      <path
        d="M34 38c-4 0-5 2-5 5v3c0 2-1 2-3 2 2 0 3 0 3 2v3c0 3 1 5 5 5"
        className="stroke-primary"
      />
      <path
        d="M40 38c-4 0-5 2-5 5v3c0 2-1 2-3 2 2 0 3 0 3 2v3c0 3 1 5 5 5"
        className="stroke-primary"
      />
      <path
        d="M80 38c4 0 5 2 5 5v3c0 2 1 2 3 2-2 0-3 0-3 2v3c0 3-1 5-5 5"
        className="stroke-primary"
      />
      <path
        d="M86 38c4 0 5 2 5 5v3c0 2 1 2 3 2-2 0-3 0-3 2v3c0 3-1 5-5 5"
        className="stroke-primary"
      />
      <path d="M48 48h24" />
    </IllustrationFrame>
  );
}
