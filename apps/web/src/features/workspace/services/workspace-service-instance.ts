import { browserCookieKeyValueStorage } from "@/lib/cookies/browser-cookie-storage";
import { getDatabase } from "@/lib/db/database";
import { getSharedChangeFeed } from "@/lib/db/shared-change-feed";

import { createWorkspaceService, type WorkspaceService } from "./workspace.service";
import { createWorkspaceRepository } from "../repositories/workspace.repository";
import { useWorkspaceStore } from "../stores/workspace.store";

let instance: WorkspaceService | undefined;

/**
 * The app's workspace service, created on first use with the browser database, the
 * last-workspace cookie and the cross-tab change feed, and syncing with other tabs from then on. Import this module
 * only through `loadWorkspaceService`, so IndexedDB code stays out of the initial bundle.
 */
export function getWorkspaceService(): WorkspaceService {
  if (!instance) {
    const changeFeed = getSharedChangeFeed();
    instance = createWorkspaceService({
      repository: createWorkspaceRepository(getDatabase(), { changeFeed }),
      store: useWorkspaceStore,
      storage: browserCookieKeyValueStorage,
      changeFeed,
    });
    instance.syncWithOtherTabs();
  }
  return instance;
}
