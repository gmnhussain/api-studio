import * as z from "zod/mini";

import { HTTP_METHODS } from "../http/http-method";

/** One header as sent: order is kept and names may repeat (data-model.md#execution-and-response). */
export const headerPairSchema = z.object({ name: z.string(), value: z.string() });

export type HeaderPair = z.infer<typeof headerPairSchema>;

/** One field of a multipart form, as sent. */
export const formPartSchema = z.object({ name: z.string(), value: z.string() });

export type FormPart = z.infer<typeof formPartSchema>;

/**
 * The body as sent. Text bodies carry their final bytes as a string; multipart forms carry their
 * fields, and the transport writes the boundary.
 */
export const serializedBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("form_data"), parts: z.array(formPartSchema) }),
]);

export type SerializedBody = z.infer<typeof serializedBodySchema>;

/**
 * Exactly what is sent: no variables left, auth applied, query and path filled in, body
 * serialized. History stores this (with secrets redacted), and the proxy validates it on input.
 */
export const resolvedRequestSchema = z.object({
  method: z.enum(HTTP_METHODS),
  url: z.string(),
  headers: z.array(headerPairSchema),
  body: serializedBodySchema,
});

export type ResolvedRequest = z.infer<typeof resolvedRequestSchema>;
