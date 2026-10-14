"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { CodeEditorProps } from "./code-editor-props";

/** Shown while the editor chunk loads, at the size the editor will take. */
function CodeEditorSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 p-3" aria-hidden>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}

/**
 * Monaco and its workers (about 2 MB) load only when an editor first appears, never in the
 * initial route bundle (ADR-0009, performance.md).
 */
const LazyMonacoCodeEditor = dynamic(
  () => import("./monaco-code-editor").then((module) => module.MonacoCodeEditor),
  { ssr: false, loading: CodeEditorSkeleton },
);

/**
 * The app's code editor (design-system.md#shared-composites): highlighted, themed from the design
 * tokens, with folding, search and bracket matching. It fills its container.
 */
export function CodeEditor(props: CodeEditorProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <LazyMonacoCodeEditor {...props} />
    </div>
  );
}
