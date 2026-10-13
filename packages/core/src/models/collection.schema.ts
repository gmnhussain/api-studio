import * as z from "zod/mini";

import { authConfigSchema } from "./auth.schema";
import { variableSchema } from "./key-value-entry.schema";
import { idSchema, isoDateTimeSchema, nameSchema, sortKeySchema } from "./primitives.schema";
import { requestDefinitionSchema } from "./request.schema";

/** A named, exportable tree of folders and requests. Its auth is inherited by `inherit` items. */
export const collectionSchema = z.object({
  id: idSchema<"CollectionId">(),
  workspaceId: idSchema<"WorkspaceId">(),
  name: nameSchema,
  description: z.string(),
  auth: authConfigSchema,
  variables: z.array(variableSchema),
  sortKey: sortKeySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Collection = z.infer<typeof collectionSchema>;

/** Fields every collection item has. Items are stored flat and linked by `parentId`. */
const collectionItemBaseShape = {
  id: idSchema<"CollectionItemId">(),
  collectionId: idSchema<"CollectionId">(),
  /** `null` places the item at the collection's root. */
  parentId: z.nullable(idSchema<"CollectionItemId">()),
  name: nameSchema,
  sortKey: sortKeySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
};

export const folderItemSchema = z.object({
  ...collectionItemBaseShape,
  type: z.literal("folder"),
  auth: authConfigSchema,
  description: z.string(),
});

export type FolderItem = z.infer<typeof folderItemSchema>;

export const requestItemSchema = z.object({
  ...collectionItemBaseShape,
  type: z.literal("request"),
  request: requestDefinitionSchema,
});

export type RequestItem = z.infer<typeof requestItemSchema>;

/** A folder or a request inside a collection tree. */
export const collectionItemSchema = z.discriminatedUnion("type", [
  folderItemSchema,
  requestItemSchema,
]);

export type CollectionItem = z.infer<typeof collectionItemSchema>;
