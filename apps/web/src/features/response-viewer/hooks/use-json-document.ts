"use client";

import { useEffect, useState } from "react";

import { getBodyTaskRunner } from "../lib/body-task-runners";
import { openJsonDocument, type JsonDocument } from "../lib/json-document";

/** A JSON body on its way to the tree. */
export type JsonDocumentState =
  { status: "parsing" } | { status: "invalid" } | { status: "ready"; document: JsonDocument };

type OpenedDocument = { source: string; document: JsonDocument | null };

/**
 * Parses a JSON body for the tree (in the body worker when it is large) and keeps it open while
 * the tree shows it; the document is closed when the body changes or the tree goes away.
 */
export function useJsonDocument(text: string): JsonDocumentState {
  const [opened, setOpened] = useState<OpenedDocument | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let document: JsonDocument | null = null;
    openJsonDocument(getBodyTaskRunner(text.length), text).then(
      (result) => {
        if (!isCurrent) {
          result?.close();
          return;
        }
        document = result;
        setOpened({ source: text, document: result });
      },
      () => {
        if (isCurrent) setOpened({ source: text, document: null });
      },
    );
    return () => {
      isCurrent = false;
      document?.close();
    };
  }, [text]);

  if (opened?.source !== text) return { status: "parsing" };
  return opened.document ? { status: "ready", document: opened.document } : { status: "invalid" };
}
