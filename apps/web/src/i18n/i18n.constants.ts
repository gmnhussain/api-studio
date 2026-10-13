/** Locales with a message catalog in `messages/`. English only for now (ADR-0010). */
export const LOCALES = ["en"] as const;

/** A locale API Studio has messages for. */
export type Locale = (typeof LOCALES)[number];

/** The locale every request uses until locale routing exists. */
export const DEFAULT_LOCALE: Locale = "en";
