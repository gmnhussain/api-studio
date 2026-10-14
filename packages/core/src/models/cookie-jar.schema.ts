import * as z from "zod/mini";

import { idSchema, isoDateTimeSchema } from "./primitives.schema";
import { responseCookieSchema } from "../execution/execution-result.schema";

/**
 * The cookies a workspace has collected from responses (F-06), sent with later requests whose
 * URL they match. One jar per workspace.
 */
export const cookieJarSchema = z.object({
  workspaceId: idSchema<"WorkspaceId">(),
  cookies: z.array(responseCookieSchema),
  updatedAt: isoDateTimeSchema,
});

export type CookieJar = z.infer<typeof cookieJarSchema>;
