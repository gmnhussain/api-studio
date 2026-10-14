"use client";

import { useEffect, useState, type RefObject } from "react";

/** Which ends of a horizontally scrolling element hide content. */
export type HorizontalOverflow = { start: boolean; end: boolean };

/** Scroll positions within this many pixels of an end count as at that end. */
const EDGE_TOLERANCE_PIXELS = 1;

/**
 * Tracks whether a scroll container has hidden content to its left or right, for fade edges and
 * scroll hints. Updates on scroll, on resize and when its children change.
 */
export function useHorizontalOverflow(ref: RefObject<HTMLElement | null>): HorizontalOverflow {
  const [overflow, setOverflow] = useState<HorizontalOverflow>({ start: false, end: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const start = element.scrollLeft > EDGE_TOLERANCE_PIXELS;
      const end =
        element.scrollLeft + element.clientWidth < element.scrollWidth - EDGE_TOLERANCE_PIXELS;
      setOverflow((current) =>
        current.start === start && current.end === end ? current : { start, end },
      );
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(element, { childList: true, subtree: true });
    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref]);

  return overflow;
}
