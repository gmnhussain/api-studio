import type { IndexableType, Table } from "dexie";
import type * as z from "zod/mini";

import type { ChangeFeed } from "./change-feed";
import type { TableName } from "./database";

/** A record that failed validation when it was read, reported instead of crashing the app. */
export type InvalidRecord = { table: TableName; id: unknown; issues: readonly string[] };

/** Receives invalid records; the console feature shows them (M4). */
export type InvalidRecordReporter = (record: InvalidRecord) => void;

/**
 * Persistence for one table: reads are validated, writes notify other tabs. Feature
 * repositories build on it and add their own queries.
 */
export type TableRepository<Entity extends { id: string }> = {
  getAll: () => Promise<Entity[]>;
  get: (id: Entity["id"]) => Promise<Entity | undefined>;
  /** Records whose `index` equals `value`; `index` must be declared in the table's schema. */
  findBy: (index: string, value: IndexableType) => Promise<Entity[]>;
  put: (record: Entity) => Promise<void>;
  bulkPut: (records: readonly Entity[]) => Promise<void>;
  delete: (id: Entity["id"]) => Promise<void>;
  bulkDelete: (ids: readonly Entity["id"][]) => Promise<void>;
};

/** What {@link createTableRepository} needs. */
export type TableRepositoryOptions<Entity extends { id: string }> = {
  tableName: TableName;
  /** The entity type comes from `schema`; the table is checked against it. */
  table: NoInfer<Table<Entity, Entity["id"]>>;
  schema: z.ZodMiniType<Entity>;
  changeFeed?: ChangeFeed;
  onInvalidRecord?: InvalidRecordReporter;
};

/**
 * Creates a {@link TableRepository}. Every record read from IndexedDB is parsed with its schema,
 * because the database can hold data from older versions or another tab's bug; invalid records
 * are skipped and reported. Writes are not re-validated: they come from typed domain code.
 */
export function createTableRepository<Entity extends { id: string }>({
  tableName,
  table,
  schema,
  changeFeed,
  onInvalidRecord,
}: TableRepositoryOptions<Entity>): TableRepository<Entity> {
  const parse = (raw: unknown): Entity | undefined => {
    const result = schema.safeParse(raw);
    if (result.success) return result.data;
    onInvalidRecord?.({
      table: tableName,
      id: typeof raw === "object" && raw !== null && "id" in raw ? raw.id : undefined,
      issues: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    });
    return undefined;
  };
  const parseAll = (rows: readonly unknown[]): Entity[] =>
    rows.map(parse).filter((record): record is Entity => record !== undefined);
  const publish = (ids: readonly string[]) => {
    if (ids.length > 0) changeFeed?.publish({ table: tableName, ids });
  };

  return {
    getAll: async () => parseAll(await table.toArray()),
    get: async (id) => {
      const raw = await table.get(id);
      return raw === undefined ? undefined : parse(raw);
    },
    findBy: async (index, value) => parseAll(await table.where(index).equals(value).toArray()),
    put: async (record) => {
      await table.put(record);
      publish([record.id]);
    },
    bulkPut: async (records) => {
      await table.bulkPut([...records]);
      publish(records.map((record) => record.id));
    },
    delete: async (id) => {
      await table.delete(id);
      publish([id]);
    },
    bulkDelete: async (ids) => {
      await table.bulkDelete([...ids]);
      publish(ids);
    },
  };
}
