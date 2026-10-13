import * as z from "zod/mini";

import { variableSchema } from "./key-value-entry.schema";
import { idSchema, isoDateTimeSchema, nameSchema } from "./primitives.schema";

/** The top-level container for collections, environments and history (glossary). */
export const workspaceSchema = z.object({
  id: idSchema<"WorkspaceId">(),
  name: nameSchema,
  activeEnvironmentId: z.nullable(idSchema<"EnvironmentId">()),
  globalVariables: z.array(variableSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Workspace = z.infer<typeof workspaceSchema>;
