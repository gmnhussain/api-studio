import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE } from "./i18n.constants";
import { englishMessages } from "./messages/english-messages";

/**
 * next-intl request configuration. The locale is fixed (no locale in the URL), so pages stay
 * statically renderable; locale routing can replace this when a second language exists.
 */
export default getRequestConfig(() =>
  Promise.resolve({ locale: DEFAULT_LOCALE, messages: englishMessages }),
);
