import * as z from "zod/mini";

import { API_KEY_PLACEMENTS, OAUTH2_GRANT_TYPES } from "./models.constants";

/**
 * How a request authenticates (F-07). `inherit` takes the nearest folder's or collection's auth.
 * OAuth 2.0 stores configuration and a pasted token; the token flow arrives later.
 */
export const authConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("inherit") }),
  z.object({ type: z.literal("basic"), username: z.string(), password: z.string() }),
  z.object({ type: z.literal("bearer"), token: z.string(), prefix: z.string() }),
  z.object({
    type: z.literal("api_key"),
    key: z.string(),
    value: z.string(),
    placement: z.enum(API_KEY_PLACEMENTS),
  }),
  z.object({
    type: z.literal("oauth2"),
    grantType: z.enum(OAUTH2_GRANT_TYPES),
    accessTokenUrl: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    scope: z.string(),
    accessToken: z.string(),
  }),
]);

export type AuthConfig = z.infer<typeof authConfigSchema>;

/** The `type` of an {@link AuthConfig}. */
export type AuthType = AuthConfig["type"];
