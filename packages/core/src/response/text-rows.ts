/**
 * The longest row a large text is shown in, in characters: longer lines are cut into rows of this
 * length, so a minified body on one line still scrolls row by row.
 */
export const TEXT_ROW_MAX_LENGTH = 2000;

/** Offsets of the rows of a text; row `i` runs from `starts[i]` to the next start. */
export type TextRows = { starts: Uint32Array; count: number; text: string };

/** Starting capacity of the offset buffer; it doubles as needed. */
const INITIAL_ROW_CAPACITY = 1024;

/**
 * Splits text into rows at line breaks, and long lines into rows of at most `maxRowLength`
 * characters, in one linear pass. Only offsets are stored, so even a body of millions of lines
 * costs a few bytes per row; row text is sliced when a row is shown.
 */
export function indexTextRows(text: string, maxRowLength = TEXT_ROW_MAX_LENGTH): TextRows {
  let starts = new Uint32Array(INITIAL_ROW_CAPACITY);
  let count = 0;
  const push = (offset: number) => {
    if (count === starts.length) {
      const grown = new Uint32Array(starts.length * 2);
      grown.set(starts);
      starts = grown;
    }
    starts[count] = offset;
    count += 1;
  };

  let lineStart = 0;
  push(0);
  for (;;) {
    const newline = text.indexOf("\n", lineStart);
    const lineEnd = newline === -1 ? text.length : newline;
    for (let cut = lineStart + maxRowLength; cut < lineEnd; cut += maxRowLength) push(cut);
    if (newline === -1) break;
    lineStart = newline + 1;
    push(lineStart);
  }
  return { starts, count, text };
}

/** The text of one row, without its line break. */
export function getTextRow(rows: TextRows, index: number): string {
  const start = rows.starts[index] ?? rows.text.length;
  const end =
    index + 1 < rows.count ? (rows.starts[index + 1] ?? rows.text.length) : rows.text.length;
  let row = rows.text.slice(start, end);
  if (row.endsWith("\n")) row = row.slice(0, -1);
  if (row.endsWith("\r")) row = row.slice(0, -1);
  return row;
}
