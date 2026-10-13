import {
  APPEARANCE_ATTRIBUTES,
  APPEARANCE_VALUES,
  DARK_SCHEME_QUERY,
  DEFAULT_APPEARANCE,
  SETTINGS_COOKIE,
} from "../settings.constants";

/**
 * Source of the inline `<head>` script that applies saved appearance settings before the first
 * paint (ADR-0011). It mirrors {@link parseAppearance} and {@link applyAppearance} in plain ES5,
 * because it runs before any bundle loads; settings-boot-script.test.ts keeps them in step.
 */
export const SETTINGS_BOOT_SCRIPT = `(function () {
  try {
    var values = ${JSON.stringify(APPEARANCE_VALUES)};
    var attributes = ${JSON.stringify(APPEARANCE_ATTRIBUTES)};
    var defaults = ${JSON.stringify(DEFAULT_APPEARANCE)};
    var prefix = ${JSON.stringify(`${SETTINGS_COOKIE}=`)};
    var saved = {};
    var cookie = document.cookie.split("; ").find(function (entry) {
      return entry.indexOf(prefix) === 0;
    });
    if (cookie) {
      try {
        var state = JSON.parse(decodeURIComponent(cookie.slice(prefix.length))).state;
        saved = (state && state.appearance) || {};
      } catch (error) {}
    }
    var root = document.documentElement;
    var theme = defaults.theme;
    Object.keys(attributes).forEach(function (key) {
      var value = values[key].indexOf(saved[key]) >= 0 ? saved[key] : defaults[key];
      root.setAttribute(attributes[key], value);
      if (key === "theme") theme = value;
    });
    var dark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia(${JSON.stringify(DARK_SCHEME_QUERY)}).matches);
    root.classList.toggle("dark", dark);
  } catch (error) {}
})();`;
