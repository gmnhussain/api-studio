import type { ResponseBody } from "../execution/execution-result.schema";

/**
 * What a response body holds, as far as viewing it goes: which views can show it and how it is
 * highlighted (extensibility.md#registries, response viewers).
 */
export const RESPONSE_BODY_FORMATS = [
  "json",
  "xml",
  "html",
  "markdown",
  "javascript",
  "css",
  "image",
  "text",
  "binary",
] as const;

export type ResponseBodyFormat = (typeof RESPONSE_BODY_FORMATS)[number];

/** Formats by media type essence (type/subtype, lower case), checked before the suffix rules. */
const FORMATS_BY_MEDIA_TYPE: Readonly<Record<string, ResponseBodyFormat>> = {
  "application/json": "json",
  "text/json": "json",
  "application/xml": "xml",
  "text/xml": "xml",
  "text/html": "html",
  "application/xhtml+xml": "html",
  "text/markdown": "markdown",
  "text/x-markdown": "markdown",
  "application/javascript": "javascript",
  "text/javascript": "javascript",
  "application/ecmascript": "javascript",
  "text/css": "css",
};

/** Characters a text body is sniffed from when it names no type: enough to pass a BOM and spaces. */
const SNIFF_LENGTH = 512;

/** An HTML document announces itself in its first tag. */
const HTML_START_PATTERN = /^<(!doctype\s+html|html[\s>]|head[\s>]|body[\s>])/i;

/**
 * The media type essence of a `Content-Type` (RFC 9110 §8.3.1): `type/subtype` in lower case,
 * without parameters, or `null` when there is none.
 */
export function getMediaTypeEssence(contentType: string | null): string | null {
  if (contentType === null) return null;
  const essence = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return essence.includes("/") ? essence : null;
}

/** Guesses the format of a text body that names no type, from how it starts. */
function sniffTextFormat(text: string): ResponseBodyFormat {
  // `trimStart` also drops a byte order mark (U+FEFF counts as whitespace).
  const start = text.slice(0, SNIFF_LENGTH).trimStart();
  if (start.startsWith("{") || start.startsWith("[")) return "json";
  if (HTML_START_PATTERN.test(start)) return "html";
  if (start.startsWith("<?xml") || start.startsWith("<")) return "xml";
  return "text";
}

/**
 * Decides how a response body is viewed: by its media type first (`+json` and `+xml` suffixes
 * included, RFC 6839), by sniffing when it names none, and as `binary` when it did not arrive as
 * text and is not an image.
 */
export function detectBodyFormat(body: ResponseBody): ResponseBodyFormat {
  const essence = getMediaTypeEssence(body.contentType);
  if (essence?.startsWith("image/")) return "image";
  if (body.encoding === "base64") return "binary";
  if (essence === null) return sniffTextFormat(body.data);

  const known = FORMATS_BY_MEDIA_TYPE[essence];
  if (known) return known;
  if (essence.endsWith("+json")) return "json";
  if (essence.endsWith("+xml")) return "xml";
  return "text";
}
