import {
  brotliDecompressSync,
  constants,
  gunzipSync,
  inflateSync,
  zstdDecompressSync,
} from "node:zlib";

/** Bytes read from a body, and whether reading stopped at the cap. */
export type ReadBody = { bytes: Buffer; truncated: boolean };

/**
 * Reads a body stream up to `maxBytes`. Past the cap it stops and destroys the stream, so a huge
 * download never fills the server's memory (request-execution.md#runner-packagesrunner).
 */
export async function readBody(
  stream: AsyncIterable<Uint8Array> & { destroy: () => void },
  maxBytes: number,
): Promise<ReadBody> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const room = maxBytes - total;
    if (chunk.length > room) {
      chunks.push(Buffer.from(chunk.subarray(0, room)));
      stream.destroy();
      return { bytes: Buffer.concat(chunks), truncated: true };
    }
    chunks.push(Buffer.from(chunk));
    total += chunk.length;
  }
  return { bytes: Buffer.concat(chunks), truncated: false };
}

/**
 * Decompresses a body by its `Content-Encoding`. A truncated body is flushed rather than finished,
 * so its start still decodes. Unknown encodings, and data that fails to decode, are kept as
 * received.
 */
export function decodeBody(bytes: Buffer, contentEncoding: string | null): Buffer {
  const encodings = (contentEncoding ?? "")
    .split(",")
    .map((encoding) => encoding.trim().toLowerCase())
    .filter((encoding) => encoding !== "" && encoding !== "identity");
  let decoded = bytes;
  try {
    for (const encoding of encodings.reverse()) {
      switch (encoding) {
        case "gzip":
        case "x-gzip":
          decoded = gunzipSync(decoded, { finishFlush: constants.Z_SYNC_FLUSH });
          break;
        case "deflate":
          decoded = inflateSync(decoded, { finishFlush: constants.Z_SYNC_FLUSH });
          break;
        case "br":
          decoded = brotliDecompressSync(decoded, {
            finishFlush: constants.BROTLI_OPERATION_FLUSH,
          });
          break;
        case "zstd":
          decoded = zstdDecompressSync(decoded);
          break;
        default:
          return bytes;
      }
    }
  } catch {
    return bytes;
  }
  return decoded;
}
