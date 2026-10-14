import errors from "./en.errors.json";
import main from "./en.json";

/**
 * The English catalog (ADR-0010). The `errors` namespace lives in its own file because the
 * global error page imports it on the client, outside every provider: it must not pull the whole
 * catalog into the initial JavaScript.
 */
export const englishMessages = { ...main, errors };
