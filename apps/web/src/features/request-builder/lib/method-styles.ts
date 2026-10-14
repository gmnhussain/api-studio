import type { HttpMethod } from "@api-studio/core";

/**
 * Text colour per method, from the `--method-*` tokens (design-system.md#http-methods). Methods
 * are always written out as well, never shown by colour alone.
 */
export const METHOD_TEXT_CLASSES: Readonly<Record<HttpMethod, string>> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  OPTIONS: "text-method-options",
  HEAD: "text-method-head",
};
