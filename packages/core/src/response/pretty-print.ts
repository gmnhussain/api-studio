import type { ResponseBodyFormat } from "./body-format";

/** Spaces per indentation level in pretty-printed bodies, matching the editor's tab size. */
export const PRETTY_PRINT_INDENT = 2;

const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const COMMA = 0x2c;
const COLON = 0x3a;
const OPEN_BRACE = 0x7b;
const CLOSE_BRACE = 0x7d;
const OPEN_BRACKET = 0x5b;
const CLOSE_BRACKET = 0x5d;
const SPACE = 0x20;
const TAB = 0x09;
const LINE_FEED = 0x0a;
const CARRIAGE_RETURN = 0x0d;

/** Line breaks with indentation, built once per level. */
function createIndenter(indentSize: number): (level: number) => string {
  const unit = " ".repeat(indentSize);
  const indents = ["\n"];
  return (level) => {
    while (indents.length <= level) indents.push(`${indents.at(-1) ?? "\n"}${unit}`);
    return indents[level] ?? "\n";
  };
}

function isJsonWhitespace(code: number): boolean {
  return code === SPACE || code === TAB || code === LINE_FEED || code === CARRIAGE_RETURN;
}

function isJsonDelimiter(code: number): boolean {
  return (
    isJsonWhitespace(code) ||
    code === QUOTE ||
    code === COMMA ||
    code === COLON ||
    code === OPEN_BRACE ||
    code === CLOSE_BRACE ||
    code === OPEN_BRACKET ||
    code === CLOSE_BRACKET
  );
}

/** The index of the quote that closes the string opened at `start`, or the last index if none. */
function findStringEnd(text: string, start: number): number {
  let from = start + 1;
  for (;;) {
    const quote = text.indexOf('"', from);
    if (quote === -1) return text.length - 1;
    let backslash = quote - 1;
    while (text.charCodeAt(backslash) === BACKSLASH) backslash -= 1;
    if ((quote - 1 - backslash) % 2 === 0) return quote;
    from = quote + 1;
  }
}

function skipJsonWhitespace(text: string, from: number): number {
  let index = from;
  while (index < text.length && isJsonWhitespace(text.charCodeAt(index))) index += 1;
  return index;
}

/**
 * Re-indents JSON text without parsing it into values, so the text keeps exactly what was
 * received: numbers beyond double precision, key order and duplicate keys stay as they are. It
 * runs in linear time and never throws; text that is not JSON comes out re-spaced, not refused.
 */
export function formatJsonText(text: string, indentSize = PRETTY_PRINT_INDENT): string {
  const indentAt = createIndenter(indentSize);
  const parts: string[] = [];
  let level = 0;
  let index = 0;

  while (index < text.length) {
    const code = text.charCodeAt(index);
    if (code === QUOTE) {
      const end = findStringEnd(text, index);
      parts.push(text.slice(index, end + 1));
      index = end + 1;
    } else if (code === OPEN_BRACE || code === OPEN_BRACKET) {
      const closing = code === OPEN_BRACE ? CLOSE_BRACE : CLOSE_BRACKET;
      const next = skipJsonWhitespace(text, index + 1);
      if (text.charCodeAt(next) === closing) {
        parts.push(text.charAt(index), text.charAt(next));
        index = next + 1;
      } else {
        level += 1;
        parts.push(text.charAt(index), indentAt(level));
        index += 1;
      }
    } else if (code === CLOSE_BRACE || code === CLOSE_BRACKET) {
      level = Math.max(0, level - 1);
      parts.push(indentAt(level), text.charAt(index));
      index += 1;
    } else if (code === COMMA) {
      parts.push(",", indentAt(level));
      index += 1;
    } else if (code === COLON) {
      parts.push(": ");
      index += 1;
    } else if (isJsonWhitespace(code)) {
      index += 1;
    } else {
      let end = index + 1;
      while (end < text.length && !isJsonDelimiter(text.charCodeAt(end))) end += 1;
      parts.push(text.slice(index, end));
      index = end;
    }
  }
  return parts.join("");
}

type XmlTokenKind = "open" | "close" | "empty" | "other" | "text";
type XmlToken = { kind: XmlTokenKind; text: string };

/** Markup that runs from `opener` to `closer` whatever it holds: comments, CDATA, instructions. */
const XML_DELIMITED: readonly { opener: string; closer: string }[] = [
  { opener: "<!--", closer: "-->" },
  { opener: "<![CDATA[", closer: "]]>" },
  { opener: "<?", closer: "?>" },
];

/** The index after the `>` that ends the tag starting at `start`, skipping quoted attributes. */
function findTagEnd(text: string, start: number): number {
  let quote: string | null = null;
  let bracketDepth = 0;
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text.charAt(index);
    if (quote !== null) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "[") {
      bracketDepth += 1;
    } else if (character === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (character === ">" && bracketDepth === 0) {
      return index + 1;
    }
  }
  return text.length;
}

/** Splits XML into tags and the trimmed text between them. */
function tokenizeXml(text: string): XmlToken[] {
  const tokens: XmlToken[] = [];
  let index = 0;
  while (index < text.length) {
    const tagStart = text.indexOf("<", index);
    const textEnd = tagStart === -1 ? text.length : tagStart;
    const between = text.slice(index, textEnd).trim();
    if (between !== "") tokens.push({ kind: "text", text: between });
    if (tagStart === -1) break;

    const delimited = XML_DELIMITED.find(({ opener }) => text.startsWith(opener, tagStart));
    if (delimited) {
      const closerIndex = text.indexOf(delimited.closer, tagStart + delimited.opener.length);
      const end = closerIndex === -1 ? text.length : closerIndex + delimited.closer.length;
      tokens.push({ kind: "other", text: text.slice(tagStart, end) });
      index = end;
      continue;
    }
    const end = findTagEnd(text, tagStart);
    const tag = text.slice(tagStart, end);
    let kind: XmlTokenKind = "open";
    if (tag.startsWith("</")) kind = "close";
    else if (tag.startsWith("<!")) kind = "other";
    else if (tag.endsWith("/>")) kind = "empty";
    tokens.push({ kind, text: tag });
    index = end;
  }
  return tokens;
}

/**
 * Indents XML one element per line; an element holding only text stays on one line. Whitespace
 * between tags is not kept, which suits reading a response; the raw view shows it as received.
 */
export function formatXmlText(text: string, indentSize = PRETTY_PRINT_INDENT): string {
  const unit = " ".repeat(indentSize);
  const tokens = tokenizeXml(text);
  const lines: string[] = [];
  let level = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    const next = tokens[index + 1];
    const afterNext = tokens[index + 2];
    if (token.kind === "open" && next?.kind === "text" && afterNext?.kind === "close") {
      lines.push(unit.repeat(level) + token.text + next.text + afterNext.text);
      index += 2;
    } else if (token.kind === "open" && next?.kind === "close") {
      lines.push(unit.repeat(level) + token.text + next.text);
      index += 1;
    } else if (token.kind === "open") {
      lines.push(unit.repeat(level) + token.text);
      level += 1;
    } else if (token.kind === "close") {
      level = Math.max(0, level - 1);
      lines.push(unit.repeat(level) + token.text);
    } else {
      lines.push(unit.repeat(level) + token.text);
    }
  }
  return lines.join("\n");
}

/**
 * The pretty form of a body in a given format, or `null` when the format has no formatter and
 * is shown as received (highlighted only).
 */
export function prettyPrintBody(format: ResponseBodyFormat, text: string): string | null {
  switch (format) {
    case "json":
      return formatJsonText(text);
    case "xml":
      return formatXmlText(text);
    case "html":
    case "markdown":
    case "javascript":
    case "css":
    case "image":
    case "text":
    case "binary":
      return null;
  }
}
