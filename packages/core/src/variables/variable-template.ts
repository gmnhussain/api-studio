/**
 * Variable references are written `{{name}}`, optionally with spaces inside the braces
 * (`{{ name }}`). Names use letters, digits, `_`, `-` and `.`; anything else between braces is
 * left as plain text.
 */
const REFERENCE_PATTERN = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

/** Plain text between references. */
export type TemplateTextToken = { type: "text"; value: string };

/** One `{{name}}` reference with its position in the source text. */
export type TemplateVariableToken = {
  type: "variable";
  name: string;
  /** The reference as written, braces included. */
  raw: string;
  start: number;
  end: number;
};

export type TemplateToken = TemplateTextToken | TemplateVariableToken;

/**
 * Splits text into plain text and variable references, for highlighting in the URL bar and
 * tables. Concatenating every token's text (`value` or `raw`) gives back the input.
 */
export function tokenizeTemplate(text: string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    const start = match.index;
    const name = match[1] ?? "";
    if (start > cursor) tokens.push({ type: "text", value: text.slice(cursor, start) });
    tokens.push({ type: "variable", name, raw: match[0], start, end: start + match[0].length });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}

/** The distinct variable names referenced in text, in order of first appearance. */
export function findVariableReferences(text: string): string[] {
  return [...new Set([...text.matchAll(REFERENCE_PATTERN)].map((match) => match[1] ?? ""))];
}

/**
 * Replaces each reference with the value `lookup` returns for its name; a reference whose lookup
 * returns `undefined` stays as written.
 */
export function replaceVariableReferences(
  text: string,
  lookup: (name: string) => string | undefined,
): string {
  return text.replace(REFERENCE_PATTERN, (raw, name: string) => lookup(name) ?? raw);
}
