const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;
const BYTES_PER_KILOBYTE = 1024;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * A byte count for people: `0 B`, `512 B`, `3.4 KB`, `1.1 MB` (design-system.md#patterns). One
 * decimal below 10 units, none above, in binary multiples as browsers' devtools show them.
 */
export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= BYTES_PER_KILOBYTE && unitIndex < BYTE_UNITS.length - 1) {
    value /= BYTES_PER_KILOBYTE;
    unitIndex += 1;
  }
  const unit = BYTE_UNITS[unitIndex] ?? "B";
  if (unitIndex === 0) return `${String(Math.round(value))} ${unit}`;
  return `${value < 10 ? value.toFixed(1) : String(Math.round(value))} ${unit}`;
}

/** A duration for people: `0 ms`, `142 ms`, `1.2 s`, `12 s`, `2 min 5 s`. */
export function formatDuration(milliseconds: number): string {
  const duration = Math.max(0, milliseconds);
  if (duration < MILLISECONDS_PER_SECOND) return `${String(Math.round(duration))} ms`;
  if (duration < MILLISECONDS_PER_MINUTE) {
    const seconds = duration / MILLISECONDS_PER_SECOND;
    return `${seconds < 10 ? seconds.toFixed(1) : String(Math.round(seconds))} s`;
  }
  const minutes = Math.floor(duration / MILLISECONDS_PER_MINUTE);
  const seconds = Math.round((duration % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND);
  return seconds === 0 ? `${String(minutes)} min` : `${String(minutes)} min ${String(seconds)} s`;
}
