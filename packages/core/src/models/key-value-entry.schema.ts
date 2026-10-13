import * as z from "zod/mini";

import { idSchema } from "./primitives.schema";

/** One row of a headers, query parameters, path variables, cookies or form table. */
export const keyValueEntrySchema = z.object({
  id: idSchema<"EntryId">(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  description: z.string(),
});

export type KeyValueEntry = z.infer<typeof keyValueEntrySchema>;

/**
 * A named value referenced as `{{key}}`. Secret values are masked in the UI, redacted in history
 * and never exported (AGENTS.md rule 7).
 */
export const variableSchema = z.extend(keyValueEntrySchema, { isSecret: z.boolean() });

export type Variable = z.infer<typeof variableSchema>;
