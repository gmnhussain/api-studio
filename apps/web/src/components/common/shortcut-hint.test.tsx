import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShortcutHint } from "./shortcut-hint";

describe("ShortcutHint", () => {
  it("renders one key per part with non-Apple labels", () => {
    const { container } = render(<ShortcutHint binding="Mod+Alt+R" />);

    const keys = [...container.querySelectorAll("[data-slot=kbd]")].map((key) => key.textContent);
    expect(keys).toEqual(["Ctrl", "Alt", "R"]);
  });

  it("is hidden from assistive technology", () => {
    const { container } = render(<ShortcutHint binding="Mod+B" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
