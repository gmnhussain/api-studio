import * as z from "zod/mini";

import { authConfigSchema } from "./auth.schema";
import { keyValueEntrySchema } from "./key-value-entry.schema";
import { MAX_REDIRECTS_LIMIT, MAX_TIMEOUT_MILLISECONDS } from "./models.constants";
import { requestBodySchema } from "./request-body.schema";
import { HTTP_METHODS } from "../http/http-method";

/** Per-request transport settings (F-09). */
export const requestSettingsSchema = z.object({
  timeoutMilliseconds: z.int().check(z.positive(), z.lte(MAX_TIMEOUT_MILLISECONDS)),
  followRedirects: z.boolean(),
  maxRedirects: z.int().check(z.gte(0), z.lte(MAX_REDIRECTS_LIMIT)),
});

export type RequestSettings = z.infer<typeof requestSettingsSchema>;

/**
 * An HTTP request as the user wrote it: the URL may contain `{{variables}}` and `:pathVariables`,
 * and `queryParameters` mirror the URL's query string.
 */
export const httpRequestDefinitionSchema = z.object({
  protocol: z.literal("http"),
  method: z.enum(HTTP_METHODS),
  url: z.string(),
  queryParameters: z.array(keyValueEntrySchema),
  pathVariables: z.array(keyValueEntrySchema),
  headers: z.array(keyValueEntrySchema),
  cookies: z.array(keyValueEntrySchema),
  auth: authConfigSchema,
  body: requestBodySchema,
  settings: requestSettingsSchema,
  description: z.string(),
});

export type HttpRequestDefinition = z.infer<typeof httpRequestDefinitionSchema>;

/**
 * A request of any protocol (ADR-0005). HTTP only today; GraphQL, WebSocket and SSE join this
 * union with their protocol adapters, and code switching on `protocol` stays exhaustive.
 */
export const requestDefinitionSchema = z.discriminatedUnion("protocol", [
  httpRequestDefinitionSchema,
]);

export type RequestDefinition = z.infer<typeof requestDefinitionSchema>;

/** The `protocol` of a {@link RequestDefinition}. */
export type Protocol = RequestDefinition["protocol"];
