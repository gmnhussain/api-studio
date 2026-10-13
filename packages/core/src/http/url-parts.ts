/** A raw URL split at its query string and fragment, without any decoding. */
export type UrlParts = {
  /** Everything before `?` or `#`: scheme, host and path, possibly with `{{variables}}`. */
  base: string;
  /** The text between `?` and `#`, or `null` when the URL has no `?`. */
  query: string | null;
  /** The text after `#`, or `null` when the URL has no `#`. */
  fragment: string | null;
};

/**
 * Splits a URL as the user typed it. Unlike `new URL()` it accepts incomplete URLs and
 * `{{variables}}`, and it never re-encodes anything, so joining the parts gives back the input.
 */
export function splitUrl(url: string): UrlParts {
  const hashIndex = url.indexOf("#");
  const withoutFragment = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? null : url.slice(hashIndex + 1);
  const questionIndex = withoutFragment.indexOf("?");
  return questionIndex === -1
    ? { base: withoutFragment, query: null, fragment }
    : {
        base: withoutFragment.slice(0, questionIndex),
        query: withoutFragment.slice(questionIndex + 1),
        fragment,
      };
}

/** Joins parts produced by {@link splitUrl} (or edited from them) back into a URL. */
export function joinUrl({ base, query, fragment }: UrlParts): string {
  return `${base}${query === null ? "" : `?${query}`}${fragment === null ? "" : `#${fragment}`}`;
}
