import { Dexie, type Table } from "dexie";

import type { Collection, CollectionItem, Environment, Workspace } from "@api-studio/core";

/** Name of the IndexedDB database (ADR-0002). */
export const DATABASE_NAME = "api-studio";

/**
 * Table definitions per database version (data-model.md#indexeddb-schema-dexie). Tables arrive
 * with the features that need them; a change adds a version with an upgrade function and a test
 * that opens data written by the previous version. Never edit a released version.
 */
export const DATABASE_VERSIONS = [
  {
    version: 1,
    stores: {
      workspaces: "id",
      collections: "id, workspaceId",
      collectionItems: "id, collectionId, [collectionId+parentId]",
      environments: "id, workspaceId",
    },
  },
] as const;

/**
 * The tables of the database, each typed with its domain record. Keys are always provided (UUID
 * v7, never auto-incremented), so tables are typed by their record and its id.
 */
export type DatabaseTables = {
  workspaces: Table<Workspace, Workspace["id"]>;
  collections: Table<Collection, Collection["id"]>;
  collectionItems: Table<CollectionItem, CollectionItem["id"]>;
  environments: Table<Environment, Environment["id"]>;
};

/** A table name, used by repositories and the change feed. */
export type TableName = keyof DatabaseTables;

export type ApiStudioDatabase = Dexie & DatabaseTables;

/**
 * Opens the database with every version applied. Records read from it are still parsed with
 * their schemas by the repositories, because IndexedDB can hold data written by older code.
 */
export function createDatabase(name: string = DATABASE_NAME): ApiStudioDatabase {
  const dexie = new Dexie(name);
  for (const { version, stores } of DATABASE_VERSIONS) dexie.version(version).stores(stores);
  // Dexie declares tables at runtime from `stores`; this is where they gain their types.
  return dexie as ApiStudioDatabase;
}

let browserDatabase: ApiStudioDatabase | undefined;

/**
 * The app's database, opened on first use. Browser-only: data lives on the user's machine and
 * is never read during server rendering.
 *
 * @throws {Error} When called on the server.
 */
export function getDatabase(): ApiStudioDatabase {
  if (typeof window === "undefined") {
    throw new Error("The database is only available in the browser");
  }
  browserDatabase ??= createDatabase();
  return browserDatabase;
}
