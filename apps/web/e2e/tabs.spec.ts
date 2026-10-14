import { expect, test } from "@playwright/test";

import {
  activeTab,
  openNewRequest,
  saveAsNew,
  tabButtons,
  tabStrip,
  urlInput,
  waitForAutoSave,
} from "./support/request-editor";
import { openStudio } from "./support/studio";

test.describe("editor tabs", () => {
  test("opens, switches and moves tabs with the keyboard", async ({ page }) => {
    await openStudio(page);
    for (const name of ["First", "Second", "Third"]) {
      await page.keyboard.press("Alt+n");
      await expect(urlInput(page)).toBeVisible();
      await urlInput(page).fill(`https://api.example.com/${name.toLowerCase()}`);
    }
    await expect(tabButtons(page)).toHaveCount(3);

    await page.keyboard.press("Alt+1");
    await expect(urlInput(page)).toHaveValue("https://api.example.com/first");
    await page.keyboard.press("Alt+[");
    await expect(urlInput(page)).toHaveValue("https://api.example.com/third");
    await page.keyboard.press("Alt+]");
    await expect(urlInput(page)).toHaveValue("https://api.example.com/first");

    await page.keyboard.press("ControlOrMeta+Shift+ArrowRight");
    await expect(
      page.getByRole("status").filter({ hasText: "moved to position 2 of 3" }),
    ).toBeAttached();
    await page.keyboard.press("Alt+1");
    await expect(urlInput(page)).toHaveValue("https://api.example.com/second");
  });

  test("asks before closing a tab with unsaved changes", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);
    await urlInput(page).fill("https://api.example.com/draft");

    await page.keyboard.press("Alt+w");
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("without saving");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(tabButtons(page)).toHaveCount(1);

    await page.keyboard.press("Alt+w");
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Close without saving" })
      .click();
    await expect(tabButtons(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "No request open" })).toBeVisible();
  });

  test("closes a saved tab at once and reopens it with Alt+Shift+T", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);
    await urlInput(page).fill("https://api.example.com/users");
    await saveAsNew(page, "Users");

    await tabStrip(page).getByRole("button", { name: "Close Users" }).click();
    await expect(tabButtons(page)).toHaveCount(0);

    await page.keyboard.press("Alt+Shift+T");
    await expect(activeTab(page)).toHaveAccessibleName("GET Users");
    await expect(urlInput(page)).toHaveValue("https://api.example.com/users");
  });

  test("pins a tab first and keeps pins and order after a reload", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);
    await urlInput(page).fill("https://api.example.com/one");
    await openNewRequest(page);
    await urlInput(page).fill("https://api.example.com/two");

    await activeTab(page).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Pin tab" }).click();
    await expect(tabButtons(page).first()).toHaveAccessibleName(/, pinned/);

    await waitForAutoSave(page, ["https://api.example.com/one", "https://api.example.com/two"]);
    await page.reload();

    await expect(tabButtons(page)).toHaveCount(2);
    await expect(tabButtons(page).first()).toHaveAccessibleName(/, pinned/);
    await expect(urlInput(page)).toHaveValue("https://api.example.com/two");
  });

  test("closes other tabs from the context menu, keeping pinned ones", async ({ page }) => {
    await openStudio(page);
    for (let index = 0; index < 3; index += 1) await openNewRequest(page);
    await tabButtons(page).first().click({ button: "right" });
    await page.getByRole("menuitem", { name: "Pin tab" }).click();

    await tabButtons(page).nth(2).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Close others" }).click();

    await expect(tabButtons(page)).toHaveCount(2);
  });
});
