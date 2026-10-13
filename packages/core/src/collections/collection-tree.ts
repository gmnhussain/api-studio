import type { CollectionId, CollectionItemId } from "../ids/ids";
import type { AuthConfig } from "../models/auth.schema";
import type { Collection, CollectionItem } from "../models/collection.schema";
import { compareSortKeys, sortBySortKey, sortKeyBetween, type SortKey } from "../ordering/sort-key";

/**
 * Pure rules over a collection's flat, `parentId`-linked items (data-model.md#collections-and-items).
 * The app, importers and the CLI all build and change trees through these.
 */

/** The direct children of a folder (or of the root when `parentId` is `null`), in order. */
export function childrenOf(
  items: readonly CollectionItem[],
  collectionId: CollectionId,
  parentId: CollectionItemId | null,
): CollectionItem[] {
  return sortBySortKey(
    items.filter((item) => item.collectionId === collectionId && item.parentId === parentId),
  );
}

/** Every item below `itemId`, at any depth, not including the item itself. */
export function descendantIds(
  items: readonly CollectionItem[],
  itemId: CollectionItemId,
): CollectionItemId[] {
  const childrenByParent = new Map<CollectionItemId, CollectionItemId[]>();
  for (const item of items) {
    if (item.parentId === null) continue;
    childrenByParent.set(item.parentId, [...(childrenByParent.get(item.parentId) ?? []), item.id]);
  }
  const found: CollectionItemId[] = [];
  const pending = [...(childrenByParent.get(itemId) ?? [])];
  while (pending.length > 0) {
    const next = pending.pop();
    if (next === undefined || found.includes(next)) continue;
    found.push(next);
    pending.push(...(childrenByParent.get(next) ?? []));
  }
  return found;
}

/**
 * The folders above an item, nearest first. Stops at a missing parent or a cycle, which only
 * corrupted data can contain, instead of looping.
 */
export function ancestorsOf(
  items: readonly CollectionItem[],
  itemId: CollectionItemId,
): CollectionItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ancestors: CollectionItem[] = [];
  let parentId = byId.get(itemId)?.parentId ?? null;
  while (parentId !== null) {
    const parent = byId.get(parentId);
    if (!parent || ancestors.includes(parent)) break;
    ancestors.push(parent);
    parentId = parent.parentId;
  }
  return ancestors;
}

/**
 * The auth chain an item inherits through (for `resolveInheritedAuth`): its own auth when it has
 * one, then each ancestor folder's, then the collection's.
 */
export function authChainOf(
  items: readonly CollectionItem[],
  collection: Collection,
  itemId: CollectionItemId,
): AuthConfig[] {
  const item = items.find((candidate) => candidate.id === itemId);
  const own =
    item?.type === "folder" ? [item.auth] : item?.type === "request" ? [item.request.auth] : [];
  const folders = ancestorsOf(items, itemId).flatMap((ancestor) =>
    ancestor.type === "folder" ? [ancestor.auth] : [],
  );
  return [...own, ...folders, collection.auth];
}

/** Why a move was refused. */
export type InvalidMoveReason = "not_found" | "not_a_folder" | "into_itself";

/**
 * Checks that an item may move under `parentId`: the parent must be a folder of the same
 * collection, and a folder may not move into itself or anything below it.
 */
export function validateMove(
  items: readonly CollectionItem[],
  itemId: CollectionItemId,
  parentId: CollectionItemId | null,
): InvalidMoveReason | null {
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) return "not_found";
  if (parentId === null) return null;
  const parent = items.find((candidate) => candidate.id === parentId);
  if (!parent || parent.collectionId !== item.collectionId) return "not_found";
  if (parent.type !== "folder") return "not_a_folder";
  if (parentId === itemId || descendantIds(items, itemId).includes(parentId)) return "into_itself";
  return null;
}

/**
 * The sort key for placing an item among `siblings` (already in order) at `index`, where `index`
 * may equal `siblings.length` to place it last. The moving item itself is skipped when counting.
 */
export function sortKeyAtIndex(
  siblings: readonly { readonly id: string; readonly sortKey: SortKey }[],
  index: number,
  movingId?: string,
): SortKey {
  const others = siblings.filter((sibling) => sibling.id !== movingId);
  const position = Math.max(0, Math.min(index, others.length));
  const before = others[position - 1]?.sortKey ?? null;
  const after = others[position]?.sortKey ?? null;
  return sortKeyBetween(before, after);
}

/** A sort key after every sibling, for appending. */
export function sortKeyAfterLast(siblings: readonly { readonly sortKey: SortKey }[]): SortKey {
  const last = [...siblings]
    .sort((left, right) => compareSortKeys(left.sortKey, right.sortKey))
    .at(-1);
  return sortKeyBetween(last?.sortKey ?? null, null);
}
