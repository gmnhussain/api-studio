import { err, ok, type Result } from "@api-studio/core";

/** Spaces per indentation level, matching the editor's tab size. */
const JSON_INDENT = 2;

/**
 * Pretty-prints JSON text with two-space indentation. Text that is not valid JSON (often because
 * it holds a `{{variable}}` where a value goes) is refused, so nothing the user wrote is lost.
 */
export function formatJson(text: string): Result<string, "invalid_json"> {
  try {
    return ok(JSON.stringify(JSON.parse(text), null, JSON_INDENT));
  } catch {
    return err("invalid_json");
  }
}
