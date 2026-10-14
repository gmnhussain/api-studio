import type { KeyBinding } from "@/lib/keyboard/key-binding";

/**
 * Default key bindings (docs/design/layout-and-interaction.md#keyboard-shortcuts). Every
 * shortcut is defined here once; menus, tooltips and hints read from this map. Browser-reserved
 * keys (Mod+W, Mod+T, Mod+N, Mod+1…9) and DevTools keys are avoided.
 */
export const KEYMAP = {
  toggleSidebar: "Mod+B",
  toggleConsole: "Mod+J",
  toggleResponsePanel: "Mod+Alt+R",
  openSettings: "Mod+,",
  saveRequest: "Mod+S",
  sendRequest: "Mod+Enter",
  cancelRequest: "Escape",
  focusUrl: "Mod+L",
  newRequestTab: "Alt+N",
  closeTab: "Alt+W",
  reopenClosedTab: "Alt+Shift+T",
  nextTab: "Alt+]",
  previousTab: "Alt+[",
  moveTabLeft: "Mod+Shift+ArrowLeft",
  moveTabRight: "Mod+Shift+ArrowRight",
  copyTreeValue: "Mod+C",
} as const satisfies Record<string, KeyBinding>;

/** How many tabs have a "go to tab" shortcut. */
const GO_TO_TAB_COUNT = 9;

/** `Alt+1` … `Alt+9` go to the tab at that position. */
export const GO_TO_TAB_BINDINGS: readonly KeyBinding[] = Array.from(
  { length: GO_TO_TAB_COUNT },
  (_, index) => `Alt+${String(index + 1)}`,
);

/** A named shortcut from {@link KEYMAP}. */
export type KeymapCommand = keyof typeof KEYMAP;
