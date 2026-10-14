import { describe, expect, it } from "vitest";

import {
  formatKeyBinding,
  matchesKeyBinding,
  parseKeyBinding,
  toAriaKeyShortcuts,
  type KeyboardEventLike,
} from "./key-binding";

function keyEvent(overrides: Partial<KeyboardEventLike>): KeyboardEventLike {
  return {
    key: "",
    code: "",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  };
}

describe("parseKeyBinding", () => {
  it("parses modifiers and the key", () => {
    expect(parseKeyBinding("Mod+Alt+R")).toEqual({ key: "R", mod: true, alt: true, shift: false });
    expect(parseKeyBinding("Escape")).toEqual({
      key: "Escape",
      mod: false,
      alt: false,
      shift: false,
    });
  });

  it.each(["", "Mod+", "Hyper+K", "Mod+Mod+K"])("rejects %j", (binding) => {
    expect(() => parseKeyBinding(binding)).toThrow();
  });
});

describe("matchesKeyBinding", () => {
  const toggleSidebar = parseKeyBinding("Mod+B");

  it("uses ⌘ for Mod on Apple platforms and Ctrl elsewhere", () => {
    expect(matchesKeyBinding(keyEvent({ key: "b", metaKey: true }), toggleSidebar, true)).toBe(
      true,
    );
    expect(matchesKeyBinding(keyEvent({ key: "b", ctrlKey: true }), toggleSidebar, true)).toBe(
      false,
    );
    expect(matchesKeyBinding(keyEvent({ key: "b", ctrlKey: true }), toggleSidebar, false)).toBe(
      true,
    );
    expect(matchesKeyBinding(keyEvent({ key: "b", metaKey: true }), toggleSidebar, false)).toBe(
      false,
    );
  });

  it("requires exactly the binding's modifiers", () => {
    expect(matchesKeyBinding(keyEvent({ key: "b" }), toggleSidebar, false)).toBe(false);
    expect(
      matchesKeyBinding(
        keyEvent({ key: "B", ctrlKey: true, shiftKey: true }),
        toggleSidebar,
        false,
      ),
    ).toBe(false);
  });

  it("falls back to the physical key when Alt changes the character (macOS)", () => {
    const toggleResponse = parseKeyBinding("Mod+Alt+R");

    expect(
      matchesKeyBinding(
        keyEvent({ key: "®", code: "KeyR", metaKey: true, altKey: true }),
        toggleResponse,
        true,
      ),
    ).toBe(true);
  });

  it("falls back to the physical key for bracket bindings", () => {
    const nextTab = parseKeyBinding("Alt+]");

    expect(
      matchesKeyBinding(keyEvent({ key: "‘", code: "BracketRight", altKey: true }), nextTab, true),
    ).toBe(true);
    expect(
      matchesKeyBinding(keyEvent({ key: "‘", code: "BracketLeft", altKey: true }), nextTab, true),
    ).toBe(false);
  });
});

describe("formatKeyBinding", () => {
  it("renders platform symbols in order", () => {
    expect(formatKeyBinding(parseKeyBinding("Mod+Shift+k"), true)).toEqual(["⌘", "⇧", "K"]);
    expect(formatKeyBinding(parseKeyBinding("Mod+Alt+R"), false)).toEqual(["Ctrl", "Alt", "R"]);
    expect(formatKeyBinding(parseKeyBinding("Mod+Enter"), true)).toEqual(["⌘", "↵"]);
  });
});

describe("toAriaKeyShortcuts", () => {
  it("uses Meta on Apple platforms and Control elsewhere", () => {
    expect(toAriaKeyShortcuts(parseKeyBinding("Mod+Alt+r"), true)).toBe("Meta+Alt+R");
    expect(toAriaKeyShortcuts(parseKeyBinding("Mod+B"), false)).toBe("Control+B");
  });
});
