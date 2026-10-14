"use client";

import dynamic from "next/dynamic";

import { CodeEditor } from "@/components/common/code-editor/code-editor";
import type { CodeEditorLanguage } from "@/components/common/code-editor/code-editor-props";

import { CODE_EDITOR_MAX_CHARACTERS } from "../../lib/body-size-limits";

/** The large text view loads with its list library only when a body needs it. */
const LargeTextView = dynamic(
  () => import("./large-text-view").then((module) => module.LargeTextView),
  { ssr: false },
);

/** Props for {@link BodyText}. */
export type BodyTextProps = {
  text: string;
  language: CodeEditorLanguage;
  "aria-label": string;
};

/**
 * Read-only body text: in the code editor (highlighting, folding, search) up to
 * {@link CODE_EDITOR_MAX_CHARACTERS}, in the virtualized text view beyond, where JSON keeps
 * its colours.
 */
export function BodyText({ text, language, "aria-label": ariaLabel }: BodyTextProps) {
  if (text.length > CODE_EDITOR_MAX_CHARACTERS) {
    return (
      <LargeTextView text={text} highlightsJson={language === "json"} aria-label={ariaLabel} />
    );
  }
  return <CodeEditor value={text} language={language} isReadOnly aria-label={ariaLabel} />;
}
