import { expect, test } from "@playwright/test";

import { readCumulativeLayoutShift, recordLayoutShifts } from "./support/layout-shift";
import { LAYOUT_COOKIE, openStudio, WORKSPACE_URL_PATTERN } from "./support/studio";

test.describe("studio shell", () => {
  test("opens the workspace from / with every region in place", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(WORKSPACE_URL_PATTERN);
    await expect(page).toHaveTitle("Workspace · API Studio");
    await expect(page.getByRole("navigation", { name: "Views" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Collections" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Response" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Console" })).toBeVisible();
    await expect(page.getByRole("contentinfo", { name: "Status" })).toContainText("Online");
  });

  test("switches sidebar sections from the rail", async ({ page }) => {
    await openStudio(page);
    const history = page.getByRole("button", { name: "History" });

    await history.click();

    await expect(history).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "No history yet" })).toBeVisible();
  });

  test("toggles the sidebar, console and response with shortcuts", async ({ page }) => {
    await openStudio(page);
    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.getByRole("button", { name: "Show sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.keyboard.press("ControlOrMeta+j");
    await expect(page.getByRole("region", { name: "Console" })).toBeHidden();
    await page.keyboard.press("ControlOrMeta+Alt+r");
    await expect(page.getByRole("region", { name: "Response" })).toBeHidden();

    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.getByRole("region", { name: "Collections" })).toBeVisible();
  });

  test("resizes the sidebar from the keyboard", async ({ page }) => {
    await openStudio(page);
    const sidebar = page.getByRole("region", { name: "Collections" });
    const widthBefore = (await sidebar.boundingBox())?.width ?? 0;

    await page.getByRole("separator", { name: "Resize sidebar" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect
      .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
      .toBeGreaterThan(widthBefore);
  });

  test("restores a collapsed sidebar without a layout shift", async ({ page }) => {
    await openStudio(page);
    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.getByRole("region", { name: "Collections" })).toBeHidden();
    const layoutCookies = (await page.context().cookies()).filter(
      (cookie) => cookie.name === LAYOUT_COOKIE,
    );
    expect(layoutCookies).toHaveLength(1);

    // If the server rendered the default layout and the client then collapsed the sidebar, the
    // content would jump sideways and register as a layout shift.
    await page.addInitScript(recordLayoutShifts);
    await openStudio(page);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("region", { name: "Collections" })).toBeHidden();
    expect(await page.evaluate(readCumulativeLayoutShift)).toBeLessThan(0.02);
  });

  test("opens settings with Mod+,", async ({ page }) => {
    await openStudio(page);

    await page.keyboard.press("ControlOrMeta+Comma");

    await expect(page).toHaveURL("/settings/appearance");
    await expect(page.getByRole("heading", { name: "Appearance", level: 2 })).toBeVisible();
  });
});

test.describe("narrow screens", () => {
  test.use({ viewport: { width: 900, height: 700 } });

  test("opens the sidebar as an overlay sheet", async ({ page }) => {
    await openStudio(page);
    await expect(page.getByRole("region", { name: "Collections" })).toBeHidden();

    await page.getByRole("button", { name: "Collections" }).click();
    const sheet = page.getByRole("dialog", { name: "Sidebar" });

    await expect(sheet.getByRole("heading", { name: "No collections yet" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });
});
