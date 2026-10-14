import type { EditorTab } from "@api-studio/core";

import { tabViews } from "../tab-views";

/** Whether closing a tab would lose changes, as its tab view says. */
export function isTabDirty(tab: EditorTab): boolean {
  return tabViews.get(tab.kind)?.isDirty(tab) ?? false;
}
