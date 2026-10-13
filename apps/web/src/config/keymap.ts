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
} as const satisfies Record<string, KeyBinding>;

/** A named shortcut from {@link KEYMAP}. */
export type KeymapCommand = keyof typeof KEYMAP;
