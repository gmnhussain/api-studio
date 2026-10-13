import * as z from "zod/mini";

import { variableSchema } from "./key-value-entry.schema";
import { ENVIRONMENT_COLORS } from "./models.constants";
import { idSchema, isoDateTimeSchema, nameSchema, sortKeySchema } from "./primitives.schema";

/** A named set of variables for one target, such as Local, Staging or Production. */
export const environmentSchema = z.object({
  id: idSchema<"EnvironmentId">(),
  workspaceId: idSchema<"WorkspaceId">(),
  name: nameSchema,
  color: z.enum(ENVIRONMENT_COLORS),
  variables: z.array(variableSchema),
  sortKey: sortKeySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Environment = z.infer<typeof environmentSchema>;

/** The colour tag of an {@link Environment}. */
export type EnvironmentColor = Environment["color"];
