import type { EditorTab, TabId } from "@api-studio/core";

/**
 * Pure rules for the order of tabs. Pinned tabs always come first
 * (layout-and-interaction.md#shell), so a move stays inside its group and pinning moves a tab to
 * the group boundary.
 */

/** How many tabs at the start are pinned. */
export function pinnedCount(tabs: readonly EditorTab[]): number {
  return tabs.filter((tab) => tab.isPinned).length;
}

/**
 * Moves a tab to `toIndex`, clamped to its group: a pinned tab stays among the pinned ones and an
 * unpinned tab among the others. Unknown ids leave the order unchanged.
 */
export function moveTab(tabs: readonly EditorTab[], tabId: TabId, toIndex: number): EditorTab[] {
  const tab = tabs.find((other) => other.id === tabId);
  if (!tab) return [...tabs];
  const pinned = pinnedCount(tabs);
  const [lowest, highest] = tab.isPinned ? [0, pinned - 1] : [pinned, tabs.length - 1];
  const target = Math.min(Math.max(toIndex, lowest), highest);
  const reordered = tabs.filter((other) => other.id !== tabId);
  reordered.splice(target, 0, tab);
  return reordered;
}

/** Pins a tab (to the end of the pinned group) or unpins it (to the start of the others). */
export function setPinned(
  tabs: readonly EditorTab[],
  tabId: TabId,
  isPinned: boolean,
): EditorTab[] {
  const tab = tabs.find((other) => other.id === tabId);
  if (!tab || tab.isPinned === isPinned) return [...tabs];
  const others = tabs.filter((other) => other.id !== tabId);
  others.splice(pinnedCount(others), 0, { ...tab, isPinned });
  return others;
}

/**
 * The tab to activate after tabs close: the active one if it stays open, else the nearest open
 * tab to its right, else the nearest to its left, else none.
 */
export function nextActiveTabId(
  tabs: readonly EditorTab[],
  activeTabId: TabId | null,
  closingIds: ReadonlySet<TabId>,
): TabId | null {
  if (activeTabId === null || !closingIds.has(activeTabId)) return activeTabId;
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);
  const isOpen = (tab: EditorTab) => !closingIds.has(tab.id);
  const right = tabs.slice(activeIndex + 1).find(isOpen);
  const left = tabs.slice(0, Math.max(activeIndex, 0)).reverse().find(isOpen);
  return (right ?? left)?.id ?? null;
}

/** Tabs that "close others" closes: every unpinned tab except this one. */
export function otherTabIds(tabs: readonly EditorTab[], tabId: TabId): TabId[] {
  return tabs.filter((tab) => tab.id !== tabId && !tab.isPinned).map((tab) => tab.id);
}

/** Tabs that "close to the right" closes: the unpinned tabs after this one. */
export function tabIdsToTheRight(tabs: readonly EditorTab[], tabId: TabId): TabId[] {
  const index = tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) return [];
  return tabs
    .slice(index + 1)
    .filter((tab) => !tab.isPinned)
    .map((tab) => tab.id);
}

/** The tab `offset` places from the active one, wrapping around at both ends. */
export function relativeTabId(
  tabs: readonly EditorTab[],
  activeTabId: TabId | null,
  offset: number,
): TabId | null {
  if (tabs.length === 0) return null;
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.id === activeTabId),
    0,
  );
  const index = (((activeIndex + offset) % tabs.length) + tabs.length) % tabs.length;
  return tabs[index]?.id ?? null;
}
