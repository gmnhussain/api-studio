import type { ResolvedRequest, SerializedBody } from "../execution/resolved-request.schema";
import { assertNever } from "../result/assert-never";

/** Length of the multipart boundary the transports use, for size estimates. */
const MULTIPART_BOUNDARY_LENGTH = 40;
const CRLF_BYTES = 2;

const encoder = new TextEncoder();

function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/** The request target of the start line: path and query, or `/` when there is none. */
function requestTarget(url: string): string {
  const afterScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i, "");
  const withoutFragment = afterScheme.split("#")[0] ?? "";
  return withoutFragment === "" || withoutFragment.startsWith("?")
    ? `/${withoutFragment}`
    : withoutFragment;
}

/** Bytes of a serialized body; multipart forms are estimated with a fixed boundary length. */
export function measureBodyBytes(body: SerializedBody): number {
  switch (body.kind) {
    case "none":
      return 0;
    case "text":
      return byteLength(body.text);
    case "form_data": {
      const delimiter = 2 + MULTIPART_BOUNDARY_LENGTH + CRLF_BYTES;
      const parts = body.parts.reduce(
        (total, part) =>
          total +
          delimiter +
          byteLength(`Content-Disposition: form-data; name="${part.name}"`) +
          CRLF_BYTES * 2 +
          byteLength(part.value) +
          CRLF_BYTES,
        0,
      );
      return body.parts.length === 0 ? 0 : parts + 2 + MULTIPART_BOUNDARY_LENGTH + 2 + CRLF_BYTES;
    }
    default:
      return assertNever(body, "body kind");
  }
}

/**
 * The size of a request on the wire as HTTP/1.1 would send it (F-17): start line, headers, the
 * blank line and the body. Headers the transport adds itself (Host, Content-Length) are not
 * counted, so the figure matches what the user wrote.
 */
export function measureRequestBytes(request: ResolvedRequest): number {
  const startLine =
    byteLength(`${request.method} ${requestTarget(request.url)} HTTP/1.1`) + CRLF_BYTES;
  const headers = request.headers.reduce(
    (total, header) => total + byteLength(`${header.name}: ${header.value}`) + CRLF_BYTES,
    0,
  );
  return startLine + headers + CRLF_BYTES + measureBodyBytes(request.body);
}
