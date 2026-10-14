import {
  describeJsonValue,
  formatJsonValueForCopy,
  getJsonValueAt,
  listJsonChildren,
  prettyPrintBody,
  type JsonChildRange,
  type JsonPath,
  type JsonTreeEntry,
  type ResponseBodyFormat,
} from "@api-studio/core";

/**
 * Work on response bodies, by name, with its input and output. Every task has plain data in and
 * out, so the same handler runs in the page for small bodies and in a Web Worker for large ones
 * (performance.md#strategies).
 */
export type BodyTasks = {
  /** The body pretty-printed, or `null` when its format is shown as received. */
  prettyPrint: { input: { format: ResponseBodyFormat; text: string }; output: string | null };
  /** Parses a JSON body and keeps it under `documentId`; its root row, or `null` if invalid. */
  openJsonDocument: { input: { documentId: string; text: string }; output: JsonTreeEntry | null };
  listJsonChildren: {
    input: { documentId: string; path: JsonPath; range?: JsonChildRange };
    output: JsonTreeEntry[];
  };
  /** The value at a path as it is copied (formatJsonValueForCopy). */
  copyJsonValue: { input: { documentId: string; path: JsonPath }; output: string };
  closeJsonDocument: { input: { documentId: string }; output: null };
};

export type BodyTaskName = keyof BodyTasks;
export type BodyTaskInput<Name extends BodyTaskName> = BodyTasks[Name]["input"];
export type BodyTaskOutput<Name extends BodyTaskName> = BodyTasks[Name]["output"];

/** Runs one task synchronously. */
export type BodyTaskHandler = <Name extends BodyTaskName>(
  name: Name,
  input: BodyTaskInput<Name>,
) => BodyTaskOutput<Name>;

type BodyTaskHandlers = {
  [Name in BodyTaskName]: (input: BodyTaskInput<Name>) => BodyTaskOutput<Name>;
};

/**
 * Creates a handler with its own open JSON documents. A document stays parsed until it is
 * closed, so expanding the tree never parses the body again.
 */
export function createBodyTaskHandler(): BodyTaskHandler {
  const documents = new Map<string, unknown>();

  const documentOf = (documentId: string): unknown => {
    if (!documents.has(documentId)) throw new Error(`JSON document ${documentId} is not open`);
    return documents.get(documentId);
  };

  const handlers: BodyTaskHandlers = {
    prettyPrint: ({ format, text }) => prettyPrintBody(format, text),
    openJsonDocument: ({ documentId, text }) => {
      let root: unknown;
      try {
        root = JSON.parse(text);
      } catch {
        return null;
      }
      documents.set(documentId, root);
      return describeJsonValue(root, []);
    },
    listJsonChildren: ({ documentId, path, range }) =>
      listJsonChildren(documentOf(documentId), path, range),
    copyJsonValue: ({ documentId, path }) =>
      formatJsonValueForCopy(getJsonValueAt(documentOf(documentId), path)),
    closeJsonDocument: ({ documentId }) => {
      documents.delete(documentId);
      return null;
    },
  };

  return (name, input) => handlers[name](input);
}
