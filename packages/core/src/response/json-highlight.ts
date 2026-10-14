/** What a piece of a JSON line is, for colouring it. */
export type JsonTokenKind = "key" | "string" | "number" | "keyword" | "plain";

/** A run of characters of one kind. */
export type JsonToken = { kind: JsonTokenKind; text: string };

/**
 * Strings (a key when a colon follows), numbers and the literals `true`, `false` and `null`. A
 * string may lack its closing quote, as when a long line is cut into rows.
 */
const JSON_TOKEN_PATTERN =
  /("(?:[^"\\]|\\.)*"?)(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;

/**
 * Splits one line of JSON into coloured runs, without parsing the document: each visible row is
 * highlighted on its own, so the cost follows what is on screen, not the body's size.
 */
export function tokenizeJsonLine(line: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let last = 0;
  for (const match of line.matchAll(JSON_TOKEN_PATTERN)) {
    const [whole, string, colon, number, keyword] = match;
    if (match.index > last) tokens.push({ kind: "plain", text: line.slice(last, match.index) });
    if (string !== undefined) {
      tokens.push({ kind: colon === undefined ? "string" : "key", text: string });
      if (colon !== undefined) tokens.push({ kind: "plain", text: colon });
    } else if (number !== undefined) {
      tokens.push({ kind: "number", text: number });
    } else if (keyword !== undefined) {
      tokens.push({ kind: "keyword", text: keyword });
    }
    last = match.index + whole.length;
  }
  if (last < line.length) tokens.push({ kind: "plain", text: line.slice(last) });
  return tokens;
}
