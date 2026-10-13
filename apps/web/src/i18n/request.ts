import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE } from "./i18n.constants";

/**
 * next-intl request configuration. The locale is fixed (no locale in the URL), so pages stay
 * statically renderable; locale routing can replace this when a second language exists.
 */
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  const messages = (await import(`./messages/${locale}.json`)) as { default: AppMessages };
  return { locale, messages: messages.default };
});
