// zod/mini: core runs in the browser, where the full Zod API costs ~50 KB (conventions.md).
import * as z from "zod/mini";

import { NAME_MAX_LENGTH } from "./models.constants";
import type { Brand, IdName } from "../ids/ids";
import type { SortKey } from "../ordering/sort-key";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * A schema for one kind of branded id: any RFC 9562 UUID, typed as that id. Records from other
 * tools get new ids when imported, so ids are always UUIDs.
 */
export function idSchema<Name extends IdName>() {
  return z.custom<Brand<string, Name>>(
    (value) => typeof value === "string" && UUID_PATTERN.test(value),
    { error: "Expected a UUID" },
  );
}

/** A fractional-index sort key: a non-empty string. */
export const sortKeySchema = z.custom<SortKey>(
  (value) => typeof value === "string" && value.length > 0,
  { error: "Expected a sort key" },
);

/** An ISO 8601 UTC timestamp, such as `2026-10-14T09:30:00.000Z`. */
export const isoDateTimeSchema = z.iso.datetime();

/** ISO 8601 UTC timestamp string (data-model.md#conventions). */
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;

/** A user-given name: trimmed text of 1 to {@link NAME_MAX_LENGTH} characters. */
export const nameSchema = z
  .string()
  .check(z.trim(), z.minLength(1, "A name is required"), z.maxLength(NAME_MAX_LENGTH));
