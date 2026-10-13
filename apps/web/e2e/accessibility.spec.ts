import { expect, test } from "@playwright/test";

import { expectNoSeriousAccessibilityViolations, openStudio } from "./support/studio";

const THEMES = ["dark", "light"] as const;

for (const theme of THEMES) {
  test.describe(`accessibility in the ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings/appearance");
      await page.getByRole("button", { name: theme === "dark" ? "Dark" : "Light" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", theme);
    });

    test("the studio has no serious WCAG 2.2 AA violations", async ({ page }) => {
      await openStudio(page);
      await expectNoSeriousAccessibilityViolations(page);
    });

    test("the settings pages have no serious WCAG 2.2 AA violations", async ({ page }) => {
      await page.goto("/settings/appearance");
      await expectNoSeriousAccessibilityViolations(page);
      await page.goto("/settings/about");
      await expectNoSeriousAccessibilityViolations(page);
    });
  });
}

test("every interactive control in the studio is reachable with Tab", async ({ page }) => {
  await openStudio(page);
  const reached = new Set<string>();

  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(
      () =>
        document.activeElement?.getAttribute("aria-label") ??
        document.activeElement?.textContent ??
        "",
    );
    reached.add(name.trim());
  }

  for (const control of ["Collections", "History", "Hide sidebar", "Settings"]) {
    expect(reached).toContain(control);
  }
});
