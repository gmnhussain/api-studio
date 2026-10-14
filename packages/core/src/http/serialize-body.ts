import type { SerializedBody } from "../execution/resolved-request.schema";
import type { KeyValueEntry } from "../models/key-value-entry.schema";
import type { RequestBody } from "../models/request-body.schema";
import { assertNever } from "../result/assert-never";

/**
 * The `Content-Type` a body implies, shown as an auto-generated header the user can override.
 * Multipart forms get their boundary from the transport, so only the type is named here.
 */
export function defaultContentType(body: RequestBody): string | null {
  switch (body.type) {
    case "none":
      return null;
    case "binary":
      return "application/octet-stream";
    case "json":
      return "application/json";
    case "text":
      return "text/plain";
    case "xml":
      return "application/xml";
    case "form_data":
      return "multipart/form-data";
    case "url_encoded":
      return "application/x-www-form-urlencoded";
    default:
      return assertNever(body, "body type");
  }
}

function enabledEntries<Entry extends KeyValueEntry>(entries: readonly Entry[]): Entry[] {
  return entries.filter((entry) => entry.enabled && entry.key !== "");
}

/**
 * Turns a body (variables already resolved) into what is sent. URL-encoded forms use the
 * WHATWG `application/x-www-form-urlencoded` serializer (`URLSearchParams`), so spaces become
 * `+` exactly as browsers send them. Disabled and nameless rows are left out. Binary bodies send
 * nothing until file bodies arrive (v0.2).
 */
export function serializeBody(body: RequestBody): SerializedBody {
  switch (body.type) {
    case "none":
    case "binary":
      return { kind: "none" };
    case "json":
    case "text":
    case "xml":
      return { kind: "text", text: body.text };
    case "url_encoded":
      return {
        kind: "text",
        text: new URLSearchParams(
          enabledEntries(body.entries).map((entry): [string, string] => [entry.key, entry.value]),
        ).toString(),
      };
    case "form_data":
      return {
        kind: "form_data",
        parts: enabledEntries(body.entries).map((entry) => ({
          name: entry.key,
          value: entry.value,
        })),
      };
    default:
      return assertNever(body, "body type");
  }
}
