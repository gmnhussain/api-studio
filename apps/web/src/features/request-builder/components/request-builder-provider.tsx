"use client";

import { useTranslations } from "next-intl";
import { createContext, use, useState, type ReactNode } from "react";
import { toast } from "sonner";

import type { TabId } from "@api-studio/core";

import { SaveRequestDialog } from "./save-request-dialog";
import { useRequestBuilderErrorMessage } from "../hooks/use-request-builder-error-message";
import { useRequestSession } from "../hooks/use-request-session";
import type { RequestService } from "../services/request.service";
import { useRequestStore } from "../stores/request.store";

/** What request editors and the tab strip use: the service once loaded, and the save flow. */
export type RequestBuilderContextValue = {
  /** `null` until the request service has loaded after the first paint. */
  service: RequestService | null;
  /** Saves a tab (`Mod+S`), asking for a location the first time. */
  save: (tabId: TabId) => Promise<void>;
  /** Opens a new, empty request tab (`Alt+N`). */
  newRequest: () => void;
};

const RequestBuilderContext = createContext<RequestBuilderContextValue | null>(null);

/** The request builder of the nearest {@link RequestBuilderProvider}. */
export function useRequestBuilder(): RequestBuilderContextValue {
  const value = use(RequestBuilderContext);
  if (!value) throw new Error("useRequestBuilder must be used inside a RequestBuilderProvider");
  return value;
}

/**
 * Loads the request session for the open workspace and provides the save flow. Requests saved
 * for the first time open the save dialog; results are confirmed or explained with a toast.
 */
export function RequestBuilderProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("requestBuilder");
  const errorMessage = useRequestBuilderErrorMessage();
  const service = useRequestSession();
  const [saveAsTabId, setSaveAsTabId] = useState<TabId | null>(null);
  const saveAsName = useRequestStore((state) =>
    saveAsTabId === null ? "" : (state.drafts[saveAsTabId]?.name ?? ""),
  );

  const value: RequestBuilderContextValue = {
    service,
    save: async (tabId) => {
      if (!service) return;
      const result = await service.save(tabId);
      if (result.ok) toast.success(t("toasts.saved", { name: result.value.name }));
      else if (result.error === "needs_location") setSaveAsTabId(tabId);
      else toast.error(errorMessage(result.error));
    },
    newRequest: () => {
      service?.newRequest(t("untitled"));
    },
  };

  return (
    <RequestBuilderContext value={value}>
      {children}
      {service && saveAsTabId !== null ? (
        <SaveRequestDialog
          tabId={saveAsTabId}
          initialName={saveAsName}
          service={service}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSaveAsTabId(null);
          }}
          onSaved={(item) => {
            toast.success(t("toasts.saved", { name: item.name }));
          }}
        />
      ) : null}
    </RequestBuilderContext>
  );
}
