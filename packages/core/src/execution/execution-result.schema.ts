import * as z from "zod/mini";

import { headerPairSchema, resolvedRequestSchema } from "./resolved-request.schema";
import { MAX_REDIRECTS_LIMIT, MAX_TIMEOUT_MILLISECONDS } from "../models/models.constants";
import { isoDateTimeSchema } from "../models/primitives.schema";

/** `SameSite` values a response cookie can carry (RFC 6265bis). */
export const COOKIE_SAME_SITE_VALUES = ["strict", "lax", "none"] as const;

/** A cookie a response set, parsed from its `Set-Cookie` header. */
export const responseCookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  /** The domain it is sent to; a host-only cookie carries its exact host. */
  domain: z.string(),
  hostOnly: z.boolean(),
  path: z.string(),
  /** When it expires; `null` for a session cookie. */
  expiresAt: z.nullable(isoDateTimeSchema),
  secure: z.boolean(),
  httpOnly: z.boolean(),
  sameSite: z.nullable(z.enum(COOKIE_SAME_SITE_VALUES)),
});

export type ResponseCookie = z.infer<typeof responseCookieSchema>;

/** How a response body travels: text when it is valid UTF-8 text, base64 otherwise. */
export const BODY_ENCODINGS = ["text", "base64"] as const;

/** A response body as received, decompressed, possibly cut at the size cap. */
export const responseBodySchema = z.object({
  encoding: z.enum(BODY_ENCODINGS),
  data: z.string(),
  contentType: z.nullable(z.string()),
  /** Whether reading stopped at the size cap, so `data` is only the start of the body. */
  truncated: z.boolean(),
});

export type ResponseBody = z.infer<typeof responseBodySchema>;

const nonNegativeIntegerSchema = z.int().check(z.gte(0));
const durationSchema = z.number().check(z.gte(0));

/** What a request and its response weigh (F-17). */
export const executionSizesSchema = z.object({
  requestBytes: nonNegativeIntegerSchema,
  responseHeadersBytes: nonNegativeIntegerSchema,
  /** Body bytes as they arrived, before decompression. */
  responseBodyBytes: nonNegativeIntegerSchema,
  /** Body bytes after decompression. */
  decodedBodyBytes: nonNegativeIntegerSchema,
});

export type ExecutionSizes = z.infer<typeof executionSizesSchema>;

/**
 * Phases of an execution in milliseconds. Phases a transport cannot measure are `null`, never
 * guessed (request-execution.md#runner-packagesrunner).
 */
export const executionTimingsSchema = z.object({
  startedAt: isoDateTimeSchema,
  timeToFirstByteMilliseconds: z.nullable(durationSchema),
  downloadMilliseconds: z.nullable(durationSchema),
  totalMilliseconds: durationSchema,
});

export type ExecutionTimings = z.infer<typeof executionTimingsSchema>;

/** One redirect followed on the way to the final response. */
export const redirectHopSchema = z.object({
  status: z.int(),
  url: z.string(),
  location: z.string(),
});

export type RedirectHop = z.infer<typeof redirectHopSchema>;

/** What came back (glossary: Response). */
export const responseSnapshotSchema = z.object({
  status: z.int(),
  statusText: z.string(),
  /** The final URL, after any redirects. */
  url: z.string(),
  headers: z.array(headerPairSchema),
  cookies: z.array(responseCookieSchema),
  body: responseBodySchema,
  sizes: executionSizesSchema,
  timings: executionTimingsSchema,
  redirects: z.array(redirectHopSchema),
  httpVersion: z.string(),
});

export type ResponseSnapshot = z.infer<typeof responseSnapshotSchema>;

/**
 * Why an execution produced no response. Each code has its own explanation in the UI
 * (request-execution.md#executor-contract).
 */
export const EXECUTION_ERROR_CODES = [
  "TIMEOUT",
  "ABORTED",
  "NETWORK",
  "DNS",
  "TLS",
  "BLOCKED_ADDRESS",
  "TOO_MANY_REDIRECTS",
  "REQUEST_TOO_LARGE",
  "INVALID_REQUEST",
  "UNRESOLVED_VARIABLES",
  "PROXY_UNAVAILABLE",
] as const;

export type ExecutionErrorCode = (typeof EXECUTION_ERROR_CODES)[number];

/** An expected failure; `message` is technical detail for the console, not UI text. */
export const executionErrorSchema = z.object({
  code: z.enum(EXECUTION_ERROR_CODES),
  message: z.string(),
});

export type ExecutionError = z.infer<typeof executionErrorSchema>;

/** The outcome of one execution: a response, or an error with the request if it was built. */
export const executionResultSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("response"),
    request: resolvedRequestSchema,
    response: responseSnapshotSchema,
  }),
  z.object({
    outcome: z.literal("error"),
    request: z.nullable(resolvedRequestSchema),
    error: executionErrorSchema,
  }),
]);

export type ExecutionResult = z.infer<typeof executionResultSchema>;

/** Transport settings of one execution (the request's settings, capped by the executor). */
export const executeOptionsSchema = z.object({
  timeoutMilliseconds: z.int().check(z.positive(), z.lte(MAX_TIMEOUT_MILLISECONDS)),
  followRedirects: z.boolean(),
  maxRedirects: z.int().check(z.gte(0), z.lte(MAX_REDIRECTS_LIMIT)),
});

export type ExecuteOptions = z.infer<typeof executeOptionsSchema>;

/** What the proxy endpoint accepts (`POST /api/v1/executions`). */
export const executionRequestSchema = z.object({
  request: resolvedRequestSchema,
  options: executeOptionsSchema,
});

export type ExecutionRequest = z.infer<typeof executionRequestSchema>;
