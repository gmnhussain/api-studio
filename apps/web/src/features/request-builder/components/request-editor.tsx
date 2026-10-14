"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KEYMAP } from "@/config/keymap";
import type { TabViewProps } from "@/features/tabs";
import { useAriaKeyShortcuts } from "@/hooks/use-aria-key-shortcuts";
import { useHotkey } from "@/hooks/use-hotkey";

import { useInheritedAuth } from "../hooks/use-inherited-auth";
import { useRequestVariables } from "../hooks/use-request-variables";
import { DEFAULT_REQUEST_SECTION } from "../request-builder.constants";
import { AuthSection } from "./auth-section";
import { BodySection } from "./body-section";
import { ConflictNotice } from "./conflict-notice";
import { CookiesSection } from "./cookies-section";
import { HeadersSection } from "./headers-section";
import { ParamsSection } from "./params-section";
import { useRequestBuilder } from "./request-builder-provider";
import { RequestSections } from "./request-sections";
import { RequestUrlBar } from "./request-url-bar";
import { SettingsSection } from "./settings-section";
import { useDraft, useDraftEditor, useDraftStatus } from "../hooks/use-draft";
import { useRequestStore } from "../stores/request.store";

/**
 * The editor of a request tab (layout-and-interaction.md#shell): the URL row, the section tabs
 * and the active section. Every edit goes to the tab's draft, which auto-saves; `Mod+S` saves it
 * to its collection and `Mod+L` focuses the URL.
 */
export function RequestEditor({ tab }: TabViewProps) {
  const t = useTranslations("requestBuilder");
  const { service, save } = useRequestBuilder();
  const draft = useDraft(tab.id);
  const editor = useDraftEditor(tab.id);
  const { isDirty, hasConflict } = useDraftStatus(tab.id);
  const variables = useRequestVariables(tab.id);
  const inherited = useInheritedAuth(tab.id);
  const section = useRequestStore((state) => state.sections[tab.id] ?? DEFAULT_REQUEST_SECTION);
  const setSection = useRequestStore((state) => state.setSection);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const saveShortcut = useAriaKeyShortcuts(KEYMAP.saveRequest);

  useHotkey(KEYMAP.saveRequest, () => void save(tab.id));
  useHotkey(KEYMAP.focusUrl, () => urlInputRef.current?.focus());

  if (!draft) {
    return (
      <div className="flex flex-col gap-3 p-3" aria-hidden>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }
  const { request } = draft;
  const effectiveAuth = request.auth.type === "inherit" ? inherited.auth : request.auth;

  return (
    <section
      aria-label={t("editor.label", { name: draft.name })}
      className="flex h-full min-h-0 flex-col"
    >
      {hasConflict && service ? (
        <ConflictNotice
          onReload={() => {
            service.reloadSaved(tab.id);
          }}
          onKeep={() => {
            service.keepChanges(tab.id);
          }}
        />
      ) : null}
      <div className="flex shrink-0 items-center gap-2 p-3 pb-2">
        <RequestUrlBar
          method={request.method}
          url={request.url}
          onMethodChange={editor.setMethod}
          onUrlChange={editor.setUrl}
          variables={variables}
          urlInputRef={urlInputRef}
        />
        <Button
          variant="outline"
          onClick={() => void save(tab.id)}
          disabled={!service || (!isDirty && tab.entityId !== null)}
          aria-keyshortcuts={saveShortcut}
        >
          <Save aria-hidden />
          {t("editor.save")}
        </Button>
      </div>
      <RequestSections
        request={request}
        section={section}
        onSectionChange={(next) => {
          setSection(tab.id, next);
        }}
        panels={{
          params: <ParamsSection request={request} editor={editor} variables={variables} />,
          auth: (
            <AuthSection
              auth={request.auth}
              onAuthChange={editor.setAuth}
              inherited={inherited}
              variables={variables}
            />
          ),
          headers: (
            <HeadersSection
              request={request}
              effectiveAuth={effectiveAuth}
              editor={editor}
              variables={variables}
            />
          ),
          body: (
            <BodySection body={request.body} onBodyChange={editor.setBody} variables={variables} />
          ),
          cookies: <CookiesSection request={request} editor={editor} variables={variables} />,
          settings: (
            <SettingsSection settings={request.settings} onSettingsChange={editor.setSettings} />
          ),
        }}
      />
    </section>
  );
}
