"use client";

import { LoaderCircle, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { TabId } from "@api-studio/core";

import { Button } from "@/components/ui/button";
import { KEYMAP } from "@/config/keymap";
import { useExecutionService, useTabExecution } from "@/features/execution";
import { useAriaKeyShortcuts } from "@/hooks/use-aria-key-shortcuts";
import { useHotkey } from "@/hooks/use-hotkey";

/** Props for {@link SendButton}. */
export type SendButtonProps = {
  tabId: TabId;
  onSend: () => void;
};

/**
 * Sends the tab's request (`Mod+Enter`); while it is in flight the button cancels it, as does
 * `Esc` (request-execution.md#cancel-timeout-retry).
 */
export function SendButton({ tabId, onSend }: SendButtonProps) {
  const t = useTranslations("requestBuilder.send");
  const service = useExecutionService();
  const execution = useTabExecution(tabId);
  const isSending = execution?.status === "sending";
  const sendShortcut = useAriaKeyShortcuts(KEYMAP.sendRequest);
  const cancel = () => {
    service?.cancel(tabId);
  };

  useHotkey(KEYMAP.sendRequest, onSend, { enabled: service !== null });
  useHotkey(KEYMAP.cancelRequest, cancel, { enabled: isSending });

  return isSending ? (
    <Button variant="outline" onClick={cancel} aria-keyshortcuts="Escape">
      <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
      {t("cancel")}
      <X aria-hidden />
    </Button>
  ) : (
    <Button onClick={onSend} disabled={service === null} aria-keyshortcuts={sendShortcut}>
      <Send aria-hidden />
      {t("send")}
    </Button>
  );
}
