import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { renderWithProviders } from "@test/render-with-providers";

import { SETTINGS_COOKIE } from "../settings.constants";
import { SettingsProvider } from "./settings-provider";
import { ThemeSwitcher } from "./theme-switcher";

afterEach(() => {
  document.cookie = `${SETTINGS_COOKIE}=; path=/; max-age=0`;
  document.documentElement.className = "";
});

function renderThemeSwitcher() {
  return renderWithProviders(
    <SettingsProvider>
      <TooltipProvider>
        <ThemeSwitcher />
      </TooltipProvider>
    </SettingsProvider>,
  );
}

describe("ThemeSwitcher", () => {
  it("cycles dark → light → system and applies each theme to <html>", async () => {
    // Hovering would open the tooltip on every click; this test is about the theme, not the tooltip.
    const user = userEvent.setup({ skipHover: true });
    renderThemeSwitcher();

    await user.click(screen.getByRole("button", { name: "Theme: Dark. Switch theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "light");
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "Theme: Light. Switch theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "system");

    await user.click(screen.getByRole("button", { name: "Theme: System. Switch theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});
