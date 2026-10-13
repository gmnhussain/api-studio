declare global {
  interface Window {
    /** Render time of the latest largest-contentful-paint candidate, in milliseconds. */
    recordedLargestContentfulPaint?: number;
  }
}

/**
 * Page init script: records the largest contentful paint (LCP) into
 * `window.recordedLargestContentfulPaint`. The last candidate before user input is the LCP.
 */
export function recordLargestContentfulPaint(): void {
  new PerformanceObserver((list) => {
    const latest = list.getEntries().at(-1);
    if (latest) window.recordedLargestContentfulPaint = latest.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
}

/** The recorded LCP in milliseconds, or `undefined` if the browser reported none. */
export function readLargestContentfulPaint(): number | undefined {
  return window.recordedLargestContentfulPaint;
}
