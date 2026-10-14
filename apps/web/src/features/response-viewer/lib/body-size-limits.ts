/** Characters in a megabyte of ASCII text; body sizes here are measured in characters. */
const MEGABYTE = 1024 * 1024;

/**
 * Bodies longer than this are parsed and formatted in the body worker; below it, a worker round
 * trip costs more than the work (performance.md#strategies).
 */
export const WORKER_BODY_THRESHOLD = MEGABYTE;

/**
 * Text longer than this shows in the virtualized text view instead of the code editor. The
 * editor wraps and models the whole text up front, which blocks the page for hundreds of
 * milliseconds on a body of many megabytes; the text view only touches the rows in sight.
 */
export const CODE_EDITOR_MAX_CHARACTERS = 2 * MEGABYTE;
