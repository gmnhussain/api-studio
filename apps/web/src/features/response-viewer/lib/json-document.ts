import type { JsonChildRange, JsonPath, JsonTreeEntry } from "@api-studio/core";

import type { BodyTaskRunner } from "./body-task-runner";

/** A parsed JSON body the tree reads from, wherever it was parsed. */
export type JsonDocument = {
  /** The row of the whole document. */
  root: JsonTreeEntry;
  listChildren: (path: JsonPath, range?: JsonChildRange) => Promise<JsonTreeEntry[]>;
  /** The value at a path as it is copied: strings bare, the rest as indented JSON. */
  copyValue: (path: JsonPath) => Promise<string>;
  /** Frees the parsed document. */
  close: () => void;
};

/**
 * Parses a JSON body through a runner and keeps it open there.
 *
 * @returns The document, or `null` when the text is not valid JSON.
 */
export async function openJsonDocument(
  runner: BodyTaskRunner,
  text: string,
): Promise<JsonDocument | null> {
  const documentId = crypto.randomUUID();
  const root = await runner.run("openJsonDocument", { documentId, text });
  if (!root) return null;
  return {
    root,
    listChildren: (path, range) =>
      runner.run("listJsonChildren", range ? { documentId, path, range } : { documentId, path }),
    copyValue: (path) => runner.run("copyJsonValue", { documentId, path }),
    close: () => {
      void runner.run("closeJsonDocument", { documentId });
    },
  };
}
