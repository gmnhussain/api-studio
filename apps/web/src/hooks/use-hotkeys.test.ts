import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useHotkeys } from "./use-hotkeys";

describe("useHotkeys", () => {
  it("runs the matching entry and prevents the browser action", () => {
    const next = vi.fn();
    const previous = vi.fn();
    renderHook(() => {
      useHotkeys([
        { binding: "Alt+]", onPress: next },
        { binding: "Alt+[", onPress: previous },
      ]);
    });

    const notPrevented = fireEvent.keyDown(window, {
      key: "]",
      code: "BracketRight",
      altKey: true,
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(previous).not.toHaveBeenCalled();
    expect(notPrevented).toBe(false);
  });

  it("does nothing while disabled or composing", () => {
    const onPress = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => {
        useHotkeys([{ binding: "Alt+1", onPress }], { enabled });
      },
      { initialProps: { enabled: false } },
    );

    fireEvent.keyDown(window, { key: "1", code: "Digit1", altKey: true });
    rerender({ enabled: true });
    fireEvent.keyDown(window, { key: "1", code: "Digit1", altKey: true, isComposing: true });

    expect(onPress).not.toHaveBeenCalled();
  });
});
