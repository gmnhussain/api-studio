import { loadCollectionService, useCollectionStore } from "@/features/collections";
import { createTabLayoutRepository, createTabsService, useTabsStore } from "@/features/tabs";
import { getDatabase } from "@/lib/db/database";

import { createRequestService, type RequestService } from "./request.service";
import { createDraftRepository } from "../repositories/draft.repository";
import { useRequestStore } from "../stores/request.store";

let instance: Promise<RequestService> | undefined;

/** What the app reports when tabs or drafts cannot be written. */
export type RequestServiceOptions = { onSaveFailed: () => void };

/**
 * The app's request service, created on first use with the browser database. It auto-saves from
 * then on and writes pending changes when the page is hidden, the last moment a reload or a
 * closed window reliably allows. Import this module only through `loadRequestService`.
 */
export function getRequestService({
  onSaveFailed,
}: RequestServiceOptions): Promise<RequestService> {
  instance ??= loadCollectionService().then((collectionService) => {
    const database = getDatabase();
    const tabsService = createTabsService({
      repository: createTabLayoutRepository(database),
      store: useTabsStore,
      onSaveFailed,
    });
    const service = createRequestService({
      draftRepository: createDraftRepository(database),
      requestStore: useRequestStore,
      tabsStore: useTabsStore,
      collectionStore: useCollectionStore,
      tabsService,
      collectionService,
      onSaveFailed,
    });
    service.start();
    tabsService.saveChanges();

    const flush = () => void service.flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    return service;
  });
  return instance;
}
