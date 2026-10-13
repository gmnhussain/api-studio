/** The sections of the request editor, in tab order (layout-and-interaction.md#shell). */
export const REQUEST_SECTIONS = [
  "params",
  "auth",
  "headers",
  "body",
  "cookies",
  "settings",
] as const;
export type RequestSection = (typeof REQUEST_SECTIONS)[number];

/** The section a newly opened request shows. */
export const DEFAULT_REQUEST_SECTION: RequestSection = "params";

/** How long a draft waits for edits to stop before it is written to IndexedDB (F-25). */
export const DRAFT_SAVE_DELAY_MILLISECONDS = 400;

/** Why a request-builder action was refused; each has a message in the `requestBuilder` catalog. */
export const REQUEST_BUILDER_ERRORS = [
  "not_found",
  "needs_location",
  "invalid_name",
  "storage",
] as const;
export type RequestBuilderError = (typeof REQUEST_BUILDER_ERRORS)[number];
