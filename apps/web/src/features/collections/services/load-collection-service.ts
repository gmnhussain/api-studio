import type { CollectionService } from "./collection.service";

/** Loads the collection service and its IndexedDB code in their own chunk. */
export async function loadCollectionService(): Promise<CollectionService> {
  const { getCollectionService } = await import("./collection-service-instance");
  return getCollectionService();
}
