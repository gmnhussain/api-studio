/** Product name, as shown in the UI and page titles. */
export const APP_NAME = "API Studio";

/** Shown when the build did not set a version, as in unit tests. */
const UNKNOWN_VERSION = "0.0.0";

/** The running version, from the web app's package.json, set at build time (next.config.ts). */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? UNKNOWN_VERSION;
