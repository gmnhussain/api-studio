import type { Locale } from "./i18n/i18n.constants";
import type messages from "./i18n/messages/en.json";

declare global {
  /** The shape of every message catalog; English is the source of truth. */
  type AppMessages = typeof messages;
}

declare module "next-intl" {
  /** Types next-intl's locale and message keys, so a missing key fails typecheck (ADR-0010). */
  interface AppConfig {
    Locale: Locale;
    Messages: AppMessages;
  }
}
