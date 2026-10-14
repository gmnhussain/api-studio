"use client";

import dynamic from "next/dynamic";

import type { ResponseBodyFormat } from "@api-studio/core";

import { Skeleton } from "@/components/ui/skeleton";

import { HtmlPreview } from "./html-preview";
import { ImagePreview } from "./image-preview";
import { PrettyBodyView } from "./pretty-body-view";
import { RawBodyView } from "./raw-body-view";
import type { ResponseViewer } from "../../lib/response-viewers";

/** Shown while a view's code loads. */
function ViewerSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}

/** The tree (TanStack Virtual) and Markdown (react-markdown) load when first shown. */
const JsonTreeView = dynamic(
  () => import("./json-tree-view").then((module) => module.JsonTreeView),
  { ssr: false, loading: ViewerSkeleton },
);
const MarkdownPreview = dynamic(
  () => import("./markdown-preview").then((module) => module.MarkdownPreview),
  { ssr: false, loading: ViewerSkeleton },
);

/** Text formats the pretty view formats or highlights; plain text has only the raw view. */
const PRETTY_FORMATS: ReadonlySet<ResponseBodyFormat> = new Set([
  "json",
  "xml",
  "html",
  "markdown",
  "javascript",
  "css",
]);

/**
 * The body views the response viewer ships with, in the order they are offered. Pretty is the
 * default for structured text, the preview for images; HTML and Markdown previews are one
 * click away, since their source is usually what is being checked.
 */
export const BUILT_IN_RESPONSE_VIEWERS: readonly ResponseViewer[] = [
  {
    id: "pretty",
    label: "pretty",
    priority: 30,
    canView: (format, response) => response.body.encoding === "text" && PRETTY_FORMATS.has(format),
    View: PrettyBodyView,
  },
  {
    id: "tree",
    label: "tree",
    priority: 20,
    canView: (format) => format === "json",
    View: JsonTreeView,
  },
  {
    id: "raw",
    label: "raw",
    priority: 10,
    canView: (_format, response) => response.body.encoding === "text",
    View: RawBodyView,
  },
  {
    id: "image-preview",
    label: "preview",
    priority: 40,
    canView: (format) => format === "image",
    View: ImagePreview,
  },
  {
    id: "html-preview",
    label: "preview",
    priority: 0,
    canView: (format) => format === "html",
    View: HtmlPreview,
  },
  {
    id: "markdown-preview",
    label: "preview",
    priority: 0,
    canView: (format) => format === "markdown",
    View: MarkdownPreview,
  },
];
