import { expect, test } from "@playwright/test";

import {
  activeTab,
  openNewRequest,
  openSection,
  saveAsNew,
  urlInput,
  waitForAutoSave,
} from "./support/request-editor";
import { expectNoSeriousAccessibilityViolations, openStudio } from "./support/studio";

const URL_WITH_VARIABLES = "{{baseUrl}}/users/:id?page=2";

test.describe("request builder", () => {
  test("keeps the URL, query parameters and path variables in step", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await urlInput(page).fill(URL_WITH_VARIABLES);
    await expect(page.getByRole("combobox", { name: "Key of page" })).toHaveValue("page");
    await expect(page.getByRole("combobox", { name: "Value of id" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Params/ })).toContainText("2");

    await page.getByRole("combobox", { name: "Value of page" }).fill("3");
    await page.getByRole("combobox", { name: "New key" }).fill("limit");
    await expect(urlInput(page)).toHaveValue("{{baseUrl}}/users/:id?page=3&limit");

    await page.getByRole("checkbox", { name: "Send page" }).click();
    await expect(urlInput(page)).toHaveValue("{{baseUrl}}/users/:id?limit");
  });

  test("offers variables after {{ and header names while typing", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await openSection(page, "Headers");
    await page.getByRole("combobox", { name: "New key" }).pressSequentially("cont");
    await page.getByRole("option", { name: "Content-Type" }).click();
    await expect(page.getByRole("combobox", { name: "Key of Content-Type" })).toHaveValue(
      "Content-Type",
    );
  });

  test("composes, saves and restores a whole request after a reload", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await page.getByRole("combobox", { name: "Method: GET" }).click();
    await page.getByRole("option", { name: "POST" }).click();
    await urlInput(page).fill(URL_WITH_VARIABLES);

    await openSection(page, "Headers");
    await page.getByRole("combobox", { name: "New key" }).fill("X-Trace");
    await page.getByRole("combobox", { name: "Value of X-Trace" }).fill("on");

    await openSection(page, "Auth");
    await page.getByRole("combobox", { name: "Auth type" }).click();
    await page.getByRole("option", { name: "Bearer token" }).click();
    await page.getByRole("combobox", { name: "Token" }).fill("{{token}}");
    await expect(page.getByRole("combobox", { name: "Token" })).toHaveAttribute("type", "password");

    await openSection(page, "Body");
    await page.getByRole("button", { name: "JSON", exact: true }).click();
    // Monaco reads keys through a hidden textarea; clicking its text area focuses it.
    await page.locator(".monaco-editor .view-lines").click();
    await page.keyboard.insertText('{"name":"Ada"}');
    await page.getByRole("button", { name: "Format" }).click();

    await saveAsNew(page, "Create user");
    await expect(activeTab(page)).toHaveAccessibleName("POST Create user");

    await waitForAutoSave(page, [URL_WITH_VARIABLES]);
    await page.reload();

    await expect(activeTab(page)).toHaveAccessibleName("POST Create user");
    await expect(urlInput(page)).toHaveValue(URL_WITH_VARIABLES);
    await openSection(page, "Headers");
    await expect(page.getByRole("combobox", { name: "Value of X-Trace" })).toHaveValue("on");
    await expect(page.getByText("Authorization")).toBeVisible();
    await openSection(page, "Auth");
    await expect(page.getByRole("combobox", { name: "Token" })).toHaveValue("{{token}}");
    await openSection(page, "Body");
    await expect(page.locator(".monaco-editor .view-lines")).toContainText('"name": "Ada"');
  });

  test("marks unsaved changes and saves them with Mod+S", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);
    await urlInput(page).fill("https://api.example.com/health");
    await saveAsNew(page, "Health");

    await urlInput(page).fill("https://api.example.com/health?verbose");
    await expect(activeTab(page)).toHaveAccessibleName("GET Health, unsaved changes");

    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText("Saved “Health”").last()).toBeVisible();
    await expect(activeTab(page)).toHaveAccessibleName("GET Health");
  });

  test("the request editor has no serious WCAG 2.2 AA violations", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);
    await urlInput(page).fill(URL_WITH_VARIABLES);

    await expectNoSeriousAccessibilityViolations(page);
    await openSection(page, "Auth");
    await expectNoSeriousAccessibilityViolations(page);
    await openSection(page, "Settings");
    await expectNoSeriousAccessibilityViolations(page);
  });
});
