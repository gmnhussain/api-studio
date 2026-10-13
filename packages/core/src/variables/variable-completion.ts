import type { ScopedVariable, VariableMap } from "./variable-scopes";

/** An open `{{` before the cursor, with the partial name typed so far. */
export type VariableCompletion = {
  /** Start of the partial name (just after `{{` and any spaces). */
  from: number;
  /** End of the text to replace: the cursor, or past an existing `}}`. */
  to: number;
  query: string;
  /** Matching variables: names starting with the query first, then names containing it. */
  candidates: ScopedVariable[];
};

const OPEN_REFERENCE_PATTERN = /\{\{\s*([A-Za-z0-9_.-]*)$/;

/**
 * Finds the variable reference being typed at `cursor` and the variables that complete it, for
 * the `{{` autocomplete popup (F-28). Returns `null` when the cursor is not inside an open
 * reference. Matching ignores case; ties keep alphabetical order.
 */
export function getVariableCompletion(
  text: string,
  cursor: number,
  variables: VariableMap,
): VariableCompletion | null {
  const match = OPEN_REFERENCE_PATTERN.exec(text.slice(0, cursor));
  if (!match) return null;

  const query = match[1] ?? "";
  const from = cursor - query.length;
  const closing = /^[A-Za-z0-9_.-]*\s*\}\}/.exec(text.slice(cursor));
  const to = closing ? cursor + closing[0].length : cursor;

  const needle = query.toLowerCase();
  const byName = [...variables.values()].sort((left, right) => left.name.localeCompare(right.name));
  const prefixMatches = byName.filter((variable) => variable.name.toLowerCase().startsWith(needle));
  const innerMatches = byName.filter(
    (variable) =>
      !variable.name.toLowerCase().startsWith(needle) &&
      variable.name.toLowerCase().includes(needle),
  );

  return { from, to, query, candidates: [...prefixMatches, ...innerMatches] };
}
