import { getMediaTypeEssence } from "./body-format";
import type { ResponseSnapshot } from "../execution/execution-result.schema";
import { getHeader } from "../http/headers";

/** The name a download gets when neither the response nor its URL suggests one. */
export const DEFAULT_DOWNLOAD_BASE_NAME = "response";

/** Long enough for any real name, short enough for every file system. */
const MAX_FILE_NAME_LENGTH = 200;

/** File extensions by media type essence, for names that lack one. */
const EXTENSIONS_BY_MEDIA_TYPE: Readonly<Record<string, string>> = {
  "application/json": "json",
  "application/xml": "xml",
  "text/xml": "xml",
  "text/html": "html",
  "application/xhtml+xml": "html",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "text/css": "css",
  "text/javascript": "js",
  "application/javascript": "js",
  "application/yaml": "yaml",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/gzip": "gz",
  "application/octet-stream": "bin",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/** `name=value` parameters of a header value; values may be quoted strings (RFC 9110 §5.6.6). */
const PARAMETER_PATTERN = /;\s*([^\s=;]+)\s*=\s*("(?:[^"\\]|\\.)*"|[^;]*)/g;

/** An RFC 8187 extended value: `charset'language'percent-encoded`. */
const EXTENDED_VALUE_PATTERN = /^([\w!#$%&+^`{}~-]+)'[^']*'(.*)$/;

/** Characters some file system refuses in a name. */
const RESERVED_FILE_NAME_CHARACTERS: ReadonlySet<string> = new Set([
  "<",
  ">",
  ":",
  '"',
  "/",
  "\\",
  "|",
  "?",
  "*",
]);

/** Code points below this are control characters, as is DEL. */
const FIRST_PRINTABLE_CODE_POINT = 0x20;
const DELETE_CODE_POINT = 0x7f;

function isUnsafeFileNameCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    codePoint < FIRST_PRINTABLE_CODE_POINT ||
    codePoint === DELETE_CODE_POINT ||
    RESERVED_FILE_NAME_CHARACTERS.has(character)
  );
}

/** Names Windows reserves for devices, with or without an extension. */
const RESERVED_WINDOWS_NAME = /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i;

const EXTENSION_PATTERN = /\.[a-z\d]{1,8}$/i;

function unquote(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"')) return trimmed;
  return trimmed.slice(1, -1).replace(/\\(.)/g, "$1");
}

/** Decodes an RFC 8187 value; `null` when it is malformed. */
function decodeExtendedValue(value: string): string | null {
  const match = EXTENDED_VALUE_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, charset = "", encoded = ""] = match;
  try {
    if (charset.toLowerCase() === "utf-8") return decodeURIComponent(encoded);
    // ISO-8859-1, the only other charset RFC 8187 requires: each byte is one code point.
    return encoded.replace(/%([\da-f]{2})/gi, (_match, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
  } catch {
    return null;
  }
}

/**
 * The file name a `Content-Disposition` header suggests (RFC 6266): `filename*` when present and
 * readable, `filename` otherwise, `null` when there is neither.
 */
export function parseContentDispositionFileName(value: string): string | null {
  const parameters = new Map<string, string>();
  for (const match of value.matchAll(PARAMETER_PATTERN)) {
    const [, name = "", rawValue = ""] = match;
    parameters.set(name.toLowerCase(), rawValue);
  }
  const extended = parameters.get("filename*");
  const decoded = extended === undefined ? null : decodeExtendedValue(unquote(extended));
  if (decoded !== null && decoded !== "") return decoded;
  const plain = parameters.get("filename");
  return plain === undefined || unquote(plain) === "" ? null : unquote(plain);
}

/**
 * A suggested name made safe to save on any system: no directories, no reserved characters or
 * device names, no leading or trailing dots and spaces. `null` when nothing usable is left.
 */
export function sanitizeFileName(name: string): string | null {
  const base = name.split(/[/\\]/).at(-1) ?? "";
  let safe = Array.from(base, (character) =>
    isUnsafeFileNameCharacter(character) ? "_" : character,
  )
    .join("")
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .trim();
  if (safe === "") return null;
  if (RESERVED_WINDOWS_NAME.test(safe)) safe = `_${safe}`;
  if (safe.length > MAX_FILE_NAME_LENGTH) {
    const extension = EXTENSION_PATTERN.exec(safe)?.[0] ?? "";
    safe = safe.slice(0, MAX_FILE_NAME_LENGTH - extension.length) + extension;
  }
  return safe;
}

/** The last path segment of a URL, decoded; `null` when the path ends with a slash. */
function fileNameFromUrl(url: string): string | null {
  const segment = URL.parse(url)?.pathname.split("/").at(-1) ?? "";
  if (segment === "") return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** The extension that fits a `Content-Type`, without the dot, or `null` when none is known. */
export function extensionForContentType(contentType: string | null): string | null {
  const essence = getMediaTypeEssence(contentType);
  if (essence === null) return null;
  const known = EXTENSIONS_BY_MEDIA_TYPE[essence];
  if (known) return known;
  if (essence.endsWith("+json")) return "json";
  if (essence.endsWith("+xml")) return "xml";
  if (essence.startsWith("text/")) return "txt";
  return null;
}

/**
 * The name to save a response body under (F-16): the `Content-Disposition` file name, else the
 * last segment of the final URL, else `response`; an extension from the body's type is added when
 * the name has none.
 */
export function suggestDownloadFileName(
  response: Pick<ResponseSnapshot, "headers" | "url" | "body">,
): string {
  const disposition = getHeader(response.headers, "content-disposition");
  const suggested =
    (disposition === undefined
      ? null
      : sanitizeFileName(parseContentDispositionFileName(disposition) ?? "")) ??
    sanitizeFileName(fileNameFromUrl(response.url) ?? "") ??
    DEFAULT_DOWNLOAD_BASE_NAME;
  if (EXTENSION_PATTERN.test(suggested)) return suggested;
  const extension = extensionForContentType(response.body.contentType);
  return extension === null ? suggested : `${suggested}.${extension}`;
}
