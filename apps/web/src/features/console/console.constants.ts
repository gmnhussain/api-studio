/** How many entries the console keeps; older ones drop off (state-management.md#stores). */
export const CONSOLE_ENTRY_LIMIT = 1000;

/** How serious an entry is; the console filters by these. */
export const CONSOLE_LEVELS = ["info", "warning", "error"] as const;
export type ConsoleLevel = (typeof CONSOLE_LEVELS)[number];
