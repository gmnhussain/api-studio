import type { ExecutionTimings } from "../execution/execution-result.schema";

/** The measured phases of an execution, in the order they happen (F-41). */
export const TIMELINE_PHASES = ["waiting", "download"] as const;

export type TimelinePhase = (typeof TIMELINE_PHASES)[number];

/** One phase placed on the execution's time axis. */
export type TimelineSegment = {
  phase: TimelinePhase;
  /** Milliseconds from the start of the execution. */
  offsetMilliseconds: number;
  durationMilliseconds: number;
};

/**
 * The phases a transport measured, laid end to end: waiting runs from the start (redirects
 * included) to the final response's first byte, download from there to the last byte. A phase
 * the transport could not measure is left out rather than guessed.
 */
export function getTimelineSegments(timings: ExecutionTimings): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const waiting = timings.timeToFirstByteMilliseconds;
  if (waiting !== null) {
    segments.push({ phase: "waiting", offsetMilliseconds: 0, durationMilliseconds: waiting });
  }
  if (timings.downloadMilliseconds !== null) {
    segments.push({
      phase: "download",
      offsetMilliseconds: waiting ?? timings.totalMilliseconds - timings.downloadMilliseconds,
      durationMilliseconds: timings.downloadMilliseconds,
    });
  }
  return segments;
}
