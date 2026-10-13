/** Why a collection change was refused; each gets a message in the `collections` catalog (M6). */
export const COLLECTION_ERRORS = [
  "invalid_name",
  "not_found",
  "invalid_move",
  "no_workspace",
  "storage",
] as const;
export type CollectionError = (typeof COLLECTION_ERRORS)[number];
