import { descendantIds } from "./collection-tree";
import { createId, type CollectionItemId } from "../ids/ids";
import type { CollectionItem } from "../models/collection.schema";
import type { IsoDateTime } from "../models/primitives.schema";
import type { SortKey } from "../ordering/sort-key";

/** Where the copy goes and what it is called. */
export type DuplicateOptions = {
  /** Name of the copied item itself; its descendants keep their names. */
  name: string;
  /** Position of the copy among its siblings, usually right after the original. */
  sortKey: SortKey;
  now: IsoDateTime;
};

/**
 * Copies an item and everything below it with fresh ids, so the copy is independent of the
 * original (F-22). Parent links inside the copy point at the copied folders; the copy itself sits
 * next to the original. Returns the copy first, then its descendants.
 */
export function duplicateSubtree(
  items: readonly CollectionItem[],
  itemId: CollectionItemId,
  { name, sortKey, now }: DuplicateOptions,
): CollectionItem[] {
  const original = items.find((item) => item.id === itemId);
  if (!original) return [];
  const idsToCopy = [itemId, ...descendantIds(items, itemId)];
  const newIds = new Map(idsToCopy.map((id) => [id, createId<"CollectionItemId">()]));
  const byId = new Map(items.map((item) => [item.id, item]));

  return idsToCopy.flatMap((id) => {
    const item = byId.get(id);
    const newId = newIds.get(id);
    if (!item || !newId) return [];
    const isRoot = id === itemId;
    return [
      {
        ...structuredClone(item),
        id: newId,
        parentId: isRoot ? item.parentId : (newIds.get(item.parentId ?? itemId) ?? item.parentId),
        name: isRoot ? name : item.name,
        sortKey: isRoot ? sortKey : item.sortKey,
        createdAt: now,
        updatedAt: now,
      },
    ];
  });
}
