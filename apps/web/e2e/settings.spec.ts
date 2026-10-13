import { expect, test } from "@playwright/test";

import { openStudio } from "./support/studio";

/** Matches the `dark` class on `<html>` without matching a font variable class. */
const DARK_CLASS = /\bdark\b/;

test.describe("appearance settings", () => {
  test("starts dark with the Ion accent", async ({ page }) => {
    await page.goto("/settings/appearance");
    const root = page.locator("html");

    await expect(root).toHaveClass(DARK_CLASS);
    await expect(root).toHaveAttribute("data-accent", "ion");
  });

  test("applies theme, accent and density at once and keeps them after a reload", async ({
    page,
  }) => {
    await page.goto("/settings/appearance");
    const root = page.locator("html");

    await page.getByRole("button", { name: "Light" }).click();
    await page.getByRole("button", { name: "Moss" }).click();
    await page.getByRole("button", { name: "Compact" }).click();

    await expect(root).not.toHaveClass(DARK_CLASS);
    await expect(root).toHaveAttribute("data-accent", "moss");
    await expect(root).toHaveAttribute("data-density", "compact");

    await openStudio(page);
    await expect(root).not.toHaveClass(DARK_CLASS);
    await expect(root).toHaveAttribute("data-accent", "moss");
  });

  test("applies saved settings before the first paint", async ({ page }) => {
    await page.goto("/settings/appearance");
    await page.getByRole("button", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "light");

    // With every app bundle blocked, only the server HTML and the inline boot script run.
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/settings/about");

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme-mode", "light");
    await expect(root).not.toHaveClass(DARK_CLASS);
  });

  test("resets to the defaults", async ({ page }) => {
    await page.goto("/settings/appearance");
    await page.getByRole("button", { name: "Ember" }).click();

    await page.getByRole("button", { name: "Reset to defaults" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-accent", "ion");
  });

  test("shows the version and licence in About", async ({ page }) => {
    await page.goto("/settings/about");

    await expect(page.getByRole("heading", { name: "About", level: 2 })).toBeVisible();
    await expect(page.getByText("MIT")).toBeVisible();
  });
});
