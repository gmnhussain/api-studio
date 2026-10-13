import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useHotkey } from "./use-hotkey";

describe("useHotkey", () => {
  it("runs the handler and prevents the browser action for a matching key", () => {
    const onPress = vi.fn();
    renderHook(() => {
      useHotkey("Mod+B", onPress);
    });

    const notPrevented = fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true });

    expect(onPress).toHaveBeenCalledOnce();
    expect(notPrevented).toBe(false);
  });

  it("ignores other keys and missing modifiers", () => {
    const onPress = vi.fn();
    renderHook(() => {
      useHotkey("Mod+B", onPress);
    });

    fireEvent.keyDown(window, { key: "b", code: "KeyB" });
    fireEvent.keyDown(window, { key: "j", code: "KeyJ", ctrlKey: true });

    expect(onPress).not.toHaveBeenCalled();
  });

  it("does nothing while disabled or while an IME is composing", () => {
    const onPress = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => {
        useHotkey("Mod+B", onPress, { enabled });
      },
      { initialProps: { enabled: false } },
    );

    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true });
    rerender({ enabled: true });
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true, isComposing: true });

    expect(onPress).not.toHaveBeenCalled();
  });

  it("stops listening when unmounted", () => {
    const onPress = vi.fn();
    const { unmount } = renderHook(() => {
      useHotkey("Mod+B", onPress);
    });

    unmount();
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true });

    expect(onPress).not.toHaveBeenCalled();
  });
});
