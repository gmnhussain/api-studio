import {
  createKeyValueEntry,
  type FormDataEntry,
  type KeyValueEntry,
  type RequestBody,
} from "@api-studio/core";

/** The text of a body, when it has one: switching between JSON, text and XML keeps it. */
export function bodyText(body: RequestBody): string {
  return body.type === "json" || body.type === "text" || body.type === "xml" ? body.text : "";
}

/** The fields of a form body: switching between form data and URL-encoded keeps them. */
export function bodyFields(body: RequestBody): KeyValueEntry[] {
  if (body.type === "url_encoded") return body.entries;
  if (body.type === "form_data") {
    return body.entries.map(({ kind: _kind, ...entry }) => entry);
  }
  return [];
}

/** A text field of a multipart form. */
export function createFormDataEntry(
  fields: Partial<Omit<FormDataEntry, "id" | "kind">> = {},
): FormDataEntry {
  return { ...createKeyValueEntry(fields), kind: "text" };
}
