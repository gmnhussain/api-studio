/**
 * Layout breakpoints (docs/design/layout-and-interaction.md#responsive), as media queries.
 * Tailwind's `xl` (1280 px) and `lg` (1024 px) match these.
 */
export const MEDIA_QUERIES = {
  /** Below this width the response panel stacks under the request editor. */
  stackedEditors: "(max-width: 1279.98px)",
  /** Below this width the sidebar opens as an overlay sheet instead of a resizable panel. */
  overlaySidebar: "(max-width: 1023.98px)",
} as const;
