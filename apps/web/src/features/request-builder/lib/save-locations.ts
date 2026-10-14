import {
  childrenOf,
  sortBySortKey,
  type Collection,
  type CollectionId,
  type CollectionItem,
  type CollectionItemId,
} from "@api-studio/core";

/** A place a new request can be saved: a collection's root or one of its folders. */
export type SaveLocationOption = {
  /** Unique among the options; the value of the location picker. */
  id: string;
  collectionId: CollectionId;
  parentId: CollectionItemId | null;
  collectionName: string;
  /** Folder names from the collection down, empty for the root. */
  folderPath: string[];
};

/**
 * Every place a new request can go, in tree order: each collection's root followed by its
 * folders, depth first, so the picker reads like the collection tree.
 */
export function listSaveLocations(
  collections: readonly Collection[],
  items: readonly CollectionItem[],
): SaveLocationOption[] {
  const options: SaveLocationOption[] = [];
  for (const collection of sortBySortKey(collections)) {
    const visit = (parentId: CollectionItemId | null, folderPath: string[]) => {
      options.push({
        id: parentId === null ? collection.id : `${collection.id}/${parentId}`,
        collectionId: collection.id,
        parentId,
        collectionName: collection.name,
        folderPath,
      });
      for (const child of childrenOf(items, collection.id, parentId)) {
        if (child.type === "folder") visit(child.id, [...folderPath, child.name]);
      }
    };
    visit(null, []);
  }
  return options;
}
