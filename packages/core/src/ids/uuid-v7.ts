/** Sources of time and randomness, injectable so ids are testable. */
export type UuidV7Sources = {
  /** Milliseconds since the Unix epoch. */
  now: () => number;
  /** Fills a byte array with cryptographically strong random values. */
  fillRandom: (bytes: Uint8Array<ArrayBuffer>) => void;
};

const defaultSources: UuidV7Sources = {
  now: () => Date.now(),
  fillRandom: (bytes) => {
    crypto.getRandomValues(bytes);
  },
};

const HEX = Array.from({ length: 256 }, (_, value) => value.toString(16).padStart(2, "0"));

/**
 * Creates a UUID version 7 (RFC 9562): 48 bits of millisecond timestamp, then random bits. Ids
 * sort by creation time, which keeps IndexedDB indexes compact and lets records from different
 * devices merge without a central id allocator (extensibility.md#sync-cloud-workspace-collaboration).
 */
export function createUuidV7(sources: UuidV7Sources = defaultSources): string {
  const bytes = new Uint8Array(new ArrayBuffer(16));
  sources.fillRandom(bytes);

  let timestamp = Math.floor(sources.now());
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  // RFC 9562 §5.7: version 7 in the high nibble of byte 6, variant 0b10 in byte 8.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => HEX[byte] ?? "00").join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
