"use client";

import { Editor, type OnMount } from "@monaco-editor/react";
import { useEffect, useState } from "react";

import type { CodeEditorProps } from "./code-editor-props";
import { monaco } from "./monaco-setup";
import { buildMonacoTheme, MONACO_THEME_NAME } from "./monaco-theme";

/** Editor font size in pixels, matching the `text-sm` code in tables and the URL bar. */
const EDITOR_FONT_SIZE = 13;
const EDITOR_TAB_SIZE = 2;
const EDITOR_PADDING_PIXELS = 8;

/** Whether the app shows its dark theme (the boot script sets the class on `<html>`). */
function isDarkTheme(): boolean {
  return document.documentElement.classList.contains("dark");
}

/**
 * Follows the app theme and accent: the Monaco theme is rebuilt from the design tokens whenever
 * `<html>` changes its theme class or accent attribute.
 */
function useMonacoTheme(): void {
  useEffect(() => {
    const apply = () => {
      monaco.editor.defineTheme(MONACO_THEME_NAME, buildMonacoTheme(isDarkTheme()));
      monaco.editor.setTheme(MONACO_THEME_NAME);
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-accent"],
    });
    return () => {
      observer.disconnect();
    };
  }, []);
}

/**
 * The Monaco implementation of {@link CodeEditorProps}, loaded on demand by `CodeEditor`. Only
 * this file and its setup know Monaco, so the editor library can change behind the wrapper.
 */
export function MonacoCodeEditor({
  value,
  onValueChange,
  language,
  isReadOnly = false,
  "aria-label": ariaLabel,
}: CodeEditorProps) {
  useMonacoTheme();
  const [fontFamily] = useState(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim(),
  );

  const handleMount: OnMount = (editor) => {
    editor.getContainerDomNode().setAttribute("data-slot", "code-editor");
  };

  return (
    <Editor
      value={value}
      language={language}
      theme={MONACO_THEME_NAME}
      onChange={(next) => {
        onValueChange?.(next ?? "");
      }}
      onMount={handleMount}
      loading={null}
      options={{
        ariaLabel,
        readOnly: isReadOnly,
        fontFamily,
        fontSize: EDITOR_FONT_SIZE,
        tabSize: EDITOR_TAB_SIZE,
        minimap: { enabled: false },
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fixedOverflowWidgets: true,
        renderLineHighlight: "line",
        padding: { top: EDITOR_PADDING_PIXELS, bottom: EDITOR_PADDING_PIXELS },
        overviewRulerLanes: 0,
        contextmenu: true,
      }}
    />
  );
}
