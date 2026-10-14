"use client";

import { useEffect, useState, type RefObject } from "react";

/** How many columns of monospace text fit across a view, how tall one line is, and the view. */
export type TextMetrics = { columns: number; lineHeight: number; viewportHeight: number };

/** Characters in the probe; more of them average out sub-pixel glyph widths. */
export const TEXT_PROBE_LENGTH = 100;

/** Used where nothing can be measured (no layout, as in tests): a common panel width. */
const FALLBACK_METRICS: TextMetrics = { columns: 120, lineHeight: 20, viewportHeight: 600 };

function measure(container: HTMLElement, probe: HTMLElement): TextMetrics | null {
  const probeBox = probe.getBoundingClientRect();
  const wrapper = probe.parentElement;
  if (!wrapper || probeBox.width === 0) return null;
  const characterWidth = probeBox.width / TEXT_PROBE_LENGTH;
  const padding = wrapper.getBoundingClientRect().width - probeBox.width;
  return {
    columns: Math.max(1, Math.floor((container.clientWidth - padding) / characterWidth)),
    lineHeight: probeBox.height,
    viewportHeight: container.clientHeight,
  };
}

/**
 * Measures a monospace text view: the probe holds {@link TEXT_PROBE_LENGTH} characters in the
 * row's font inside a wrapper with the row's padding. Measured again whenever the view resizes,
 * and when density or fonts change the probe's size.
 */
export function useTextMetrics(
  containerRef: RefObject<HTMLElement | null>,
  probeRef: RefObject<HTMLElement | null>,
): TextMetrics {
  const [metrics, setMetrics] = useState<TextMetrics | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe || typeof ResizeObserver === "undefined") return;
    // The observer reports each element once when observing starts, then on every resize.
    const observer = new ResizeObserver(() => {
      const next = measure(container, probe);
      if (!next) return;
      setMetrics((previous) =>
        previous?.columns === next.columns &&
        previous.lineHeight === next.lineHeight &&
        previous.viewportHeight === next.viewportHeight
          ? previous
          : next,
      );
    });
    observer.observe(container);
    observer.observe(probe);
    return () => {
      observer.disconnect();
    };
  }, [containerRef, probeRef]);

  return metrics ?? FALLBACK_METRICS;
}
