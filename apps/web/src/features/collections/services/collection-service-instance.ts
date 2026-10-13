import { getDatabase } from "@/lib/db/database";
import { getSharedChangeFeed } from "@/lib/db/shared-change-feed";

import { createCollectionService, type CollectionService } from "./collection.service";
import { createCollectionRepository } from "../repositories/collection.repository";
import { useCollectionStore } from "../stores/collection.store";

let instance: CollectionService | undefined;

/**
 * The app's collection service, created on first use with the browser database and the shared
 * change feed, and syncing with other tabs from then on. Import this module only through
 * `loadCollectionService`, so IndexedDB code stays out of the initial bundle.
 */
export function getCollectionService(): CollectionService {
  if (!instance) {
    const changeFeed = getSharedChangeFeed();
    instance = createCollectionService({
      repository: createCollectionRepository(getDatabase(), { changeFeed }),
      store: useCollectionStore,
      changeFeed,
    });
    instance.syncWithOtherTabs();
  }
  return instance;
}
