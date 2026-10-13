/** A `layout-shift` performance entry (Layout Instability API; not yet in TypeScript's DOM lib). */
type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean };

declare global {
  interface Window {
    /** Layout shifts recorded by {@link recordLayoutShifts}, not caused by user input. */
    recordedLayoutShifts?: number[];
  }
}

function isLayoutShiftEntry(entry: PerformanceEntry): entry is LayoutShiftEntry {
  return "value" in entry && "hadRecentInput" in entry;
}

/**
 * Page init script: records every layout shift not caused by user input into
 * `window.recordedLayoutShifts`, from the first paint on.
 */
export function recordLayoutShifts(): void {
  const shifts: number[] = [];
  window.recordedLayoutShifts = shifts;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (isLayoutShiftEntry(entry) && !entry.hadRecentInput) shifts.push(entry.value);
    }
  }).observe({ type: "layout-shift", buffered: true });
}

/** Sums the recorded shifts: the page's cumulative layout shift so far. */
export function readCumulativeLayoutShift(): number {
  return (window.recordedLayoutShifts ?? []).reduce((total, value) => total + value, 0);
}
