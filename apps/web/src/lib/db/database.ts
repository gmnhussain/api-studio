import { Dexie, type Table } from "dexie";

import type {
  Collection,
  CollectionItem,
  CookieJar,
  Environment,
  RequestDraft,
  TabLayout,
  Workspace,
} from "@api-studio/core";

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
  {
    // M3: open tabs and their drafts, restored after a reload (F-24, F-25). Only new tables, so
    // no upgrade function is needed.
    version: 2,
    stores: {
      drafts: "tabId, workspaceId",
      tabLayouts: "workspaceId",
    },
  },
  {
    // M4: each workspace's cookie jar (F-06). A new table only, so no upgrade function.
    version: 3,
    stores: {
      cookieJars: "workspaceId",
    },
  },
] as const;

/**
 * The tables of the database, each typed with its domain record. Keys are always provided (UUID
 * v7, never auto-incremented), so tables are typed by their record and its key.
 */
export type DatabaseTables = {
  workspaces: Table<Workspace, Workspace["id"]>;
  collections: Table<Collection, Collection["id"]>;
  collectionItems: Table<CollectionItem, CollectionItem["id"]>;
  environments: Table<Environment, Environment["id"]>;
  drafts: Table<RequestDraft, RequestDraft["tabId"]>;
  tabLayouts: Table<TabLayout, TabLayout["workspaceId"]>;
  cookieJars: Table<CookieJar, CookieJar["workspaceId"]>;
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
