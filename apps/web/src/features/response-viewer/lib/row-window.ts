/**
 * The tallest a scrolling area is made, in pixels: well below the largest element height every
 * engine supports (Firefox stops near 17.9 million), so the end of any text stays reachable.
 */
export const MAX_SCROLL_HEIGHT_PIXELS = 8_000_000;

/** Where a view of fixed-height rows is scrolled. */
export type RowWindowInput = {
  scrollTop: number;
  viewportHeight: number;
  rowCount: number;
  rowHeight: number;
  /** Rows rendered beyond each edge of the viewport. */
  overscan: number;
  maxScrollHeight?: number;
};

/** The rows to render, and where. */
export type RowWindow = {
  /** Height of the scrolling content; capped, so it can be less than all rows take. */
  scrollHeight: number;
  /** First row to render. */
  first: number;
  /** Row after the last one to render. */
  end: number;
  /** Where the first rendered row goes, in the scrolling content's pixels. */
  offset: number;
};

/**
 * The rows in view for a scroll position. When all rows are taller than the cap, scrolling is
 * scaled: the scroll range maps proportionally onto the rows, so the top shows the first row and
 * the bottom the last, while rows keep their real height on screen.
 */
export function getRowWindow({
  scrollTop,
  viewportHeight,
  rowCount,
  rowHeight,
  overscan,
  maxScrollHeight = MAX_SCROLL_HEIGHT_PIXELS,
}: RowWindowInput): RowWindow {
  const contentHeight = rowCount * rowHeight;
  const scrollHeight = Math.min(contentHeight, maxScrollHeight);
  const scrollRange = Math.max(0, scrollHeight - viewportHeight);
  const contentRange = Math.max(0, contentHeight - viewportHeight);
  const clampedTop = Math.min(Math.max(scrollTop, 0), scrollRange);
  const contentTop = scrollRange === 0 ? 0 : (clampedTop / scrollRange) * contentRange;

  const firstVisible = Math.floor(contentTop / rowHeight);
  const first = Math.max(0, firstVisible - overscan);
  const end = Math.min(rowCount, Math.ceil((contentTop + viewportHeight) / rowHeight) + overscan);
  // The first visible row sits where its top is relative to the viewport, which follows scrolling.
  const offset = clampedTop - (contentTop - first * rowHeight);
  return { scrollHeight, first, end, offset };
}
