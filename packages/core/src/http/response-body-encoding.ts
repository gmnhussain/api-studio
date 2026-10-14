import type { ResponseBody } from "../execution/execution-result.schema";

/** Media types whose bodies are text even without a `charset`. */
const TEXT_MEDIA_TYPE_PATTERN =
  /^(text\/|application\/(json|xml|javascript|ecmascript|x-www-form-urlencoded|graphql)|[^;]*\+(json|xml)\b)/i;

/** Bytes per `String.fromCharCode` call, below engines' argument limits. */
const BASE64_CHUNK_BYTES = 0x8000;

/** Base64 of bytes, with APIs every runtime has (`btoa` exists in browsers and Node). */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK_BYTES));
  }
  return btoa(binary);
}

/** Whether a `Content-Type` names a textual body. */
export function isTextualContentType(contentType: string | null): boolean {
  return contentType === null || TEXT_MEDIA_TYPE_PATTERN.test(contentType);
}

/**
 * Packs a decoded body for transport and display: as text when its type is textual (or unknown)
 * and the bytes are valid UTF-8, as base64 otherwise, so images and other binary bodies arrive
 * intact. Used by every executor, so a body looks the same whichever transport sent it.
 */
export function encodeResponseBody(
  bytes: Uint8Array,
  contentType: string | null,
  truncated: boolean,
): ResponseBody {
  if (isTextualContentType(contentType)) {
    try {
      // `stream` lets a multi-byte character cut by truncation pass. A fresh decoder each time,
      // because a streaming decoder keeps those bytes for its next call.
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: truncated });
      return { encoding: "text", data: text, contentType, truncated };
    } catch {
      // Not valid UTF-8: the body is sent as base64 below.
    }
  }
  return { encoding: "base64", data: toBase64(bytes), contentType, truncated };
}

/** The bytes of a body as it was packed by {@link encodeResponseBody}: for saving or previewing. */
export function decodeResponseBody(
  body: Pick<ResponseBody, "encoding" | "data">,
): Uint8Array<ArrayBuffer> {
  if (body.encoding === "text") return new TextEncoder().encode(body.data);
  return Uint8Array.from(atob(body.data), (character) => character.charCodeAt(0));
}
