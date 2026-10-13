import * as z from "zod/mini";

import { keyValueEntrySchema } from "./key-value-entry.schema";

/** A text field of a multipart form; file fields arrive with binary bodies (v0.2). */
export const formDataEntrySchema = z.extend(keyValueEntrySchema, { kind: z.literal("text") });

export type FormDataEntry = z.infer<typeof formDataEntrySchema>;

/**
 * The request payload (F-08). Its type decides the default `Content-Type`, which the request
 * builder shows as an auto-generated header. `binary` keeps only the file name for now.
 */
export const requestBodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("json"), text: z.string() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("xml"), text: z.string() }),
  z.object({ type: z.literal("form_data"), entries: z.array(formDataEntrySchema) }),
  z.object({ type: z.literal("url_encoded"), entries: z.array(keyValueEntrySchema) }),
  z.object({ type: z.literal("binary"), fileName: z.nullable(z.string()) }),
]);

export type RequestBody = z.infer<typeof requestBodySchema>;

/** The `type` of a {@link RequestBody}. */
export type BodyType = RequestBody["type"];
