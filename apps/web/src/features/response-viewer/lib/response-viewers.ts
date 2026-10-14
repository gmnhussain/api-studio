import type { ComponentType } from "react";

import { createRegistry, type ResponseBodyFormat, type ResponseSnapshot } from "@api-studio/core";

/** Props every body view receives. */
export type ResponseViewerProps = {
  response: ResponseSnapshot;
  format: ResponseBodyFormat;
};

/** The names body views are offered under, in the response viewer's messages. */
export type ResponseViewerLabel = "pretty" | "tree" | "raw" | "preview";

/**
 * A way to show a response body (extensibility.md#registries): which bodies it can show, how
 * strongly it should be the default for them, and the view.
 */
export type ResponseViewer = {
  readonly id: string;
  readonly label: ResponseViewerLabel;
  /** Among the viewers that can show a body, the highest priority is the default. */
  readonly priority: number;
  canView: (format: ResponseBodyFormat, response: ResponseSnapshot) => boolean;
  View: ComponentType<ResponseViewerProps>;
};

/** The body views, in the order they are offered. */
export const responseViewers = createRegistry<ResponseViewer>("Response viewers");

/** The viewers that can show a body, in registration order. */
export function viewersFor(
  format: ResponseBodyFormat,
  response: ResponseSnapshot,
): readonly ResponseViewer[] {
  return responseViewers.list().filter((viewer) => viewer.canView(format, response));
}

/**
 * The viewer to show: the one the user picked for this tab when it can show the body, the
 * highest priority one otherwise, `undefined` when none can.
 */
export function pickViewer(
  viewers: readonly ResponseViewer[],
  preferredId: string | null,
): ResponseViewer | undefined {
  const preferred = viewers.find((viewer) => viewer.id === preferredId);
  if (preferred) return preferred;
  return viewers.reduce<ResponseViewer | undefined>(
    (best, viewer) => (best === undefined || viewer.priority > best.priority ? viewer : best),
    undefined,
  );
}
