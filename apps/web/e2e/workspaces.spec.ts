import { expect, test, type Page } from "@playwright/test";

import { openStudio, WORKSPACE_URL_PATTERN } from "./support/studio";

function workspaceMenu(page: Page) {
  return page.getByRole("button", { name: /^Workspace: / });
}

async function createWorkspace(page: Page, name: string): Promise<void> {
  await workspaceMenu(page).click();
  await page.getByRole("menuitem", { name: "New workspace…" }).click();
  const dialog = page.getByRole("dialog", { name: "New workspace" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create workspace" }).click();
  await expect(workspaceMenu(page)).toHaveAccessibleName(`Workspace: ${name}. Switch workspace`);
}

test.describe("workspaces", () => {
  test("creates the first workspace on first run", async ({ page }) => {
    await openStudio(page);

    await expect(workspaceMenu(page)).toHaveAccessibleName(
      "Workspace: My workspace. Switch workspace",
    );
  });

  test("creates, renames, switches and deletes workspaces, keeping them after a reload", async ({
    page,
  }) => {
    await openStudio(page);
    const firstUrl = page.url();

    await createWorkspace(page, "Side project");
    await expect(page).toHaveURL(WORKSPACE_URL_PATTERN);
    expect(page.url()).not.toBe(firstUrl);

    await workspaceMenu(page).click();
    await page.getByRole("menuitem", { name: "Rename workspace…" }).click();
    const renameDialog = page.getByRole("dialog", { name: "Rename workspace" });
    await renameDialog.getByLabel("Name").fill("Client work");
    await renameDialog.getByRole("button", { name: "Save" }).click();
    await expect(workspaceMenu(page)).toHaveAccessibleName(
      "Workspace: Client work. Switch workspace",
    );

    await page.reload();
    await expect(workspaceMenu(page)).toHaveAccessibleName(
      "Workspace: Client work. Switch workspace",
    );

    await workspaceMenu(page).click();
    await page.getByRole("menuitem", { name: "My workspace" }).click();
    await expect(page).toHaveURL(firstUrl);
    // The switcher shows the workspace once it is open, which is also when it is remembered.
    await expect(workspaceMenu(page)).toHaveAccessibleName(
      "Workspace: My workspace. Switch workspace",
    );

    await page.goto("/");
    await expect(page).toHaveURL(firstUrl);

    await workspaceMenu(page).click();
    await page.getByRole("menuitem", { name: "Client work" }).click();
    await expect(workspaceMenu(page)).toHaveAccessibleName(
      "Workspace: Client work. Switch workspace",
    );
    await workspaceMenu(page).click();
    await page.getByRole("menuitem", { name: "Delete workspace…" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete workspace" }).click();

    await expect(page).toHaveURL(firstUrl);
    await expect(page.getByText("Deleted “Client work”")).toBeVisible();
  });

  test("refuses an empty name with a message under the field", async ({ page }) => {
    await openStudio(page);
    await workspaceMenu(page).click();
    await page.getByRole("menuitem", { name: "New workspace…" }).click();
    const dialog = page.getByRole("dialog", { name: "New workspace" });

    await dialog.getByLabel("Name").fill("   ");
    await dialog.getByRole("button", { name: "Create workspace" }).click();

    await expect(dialog.getByText("Enter a name of 1 to 120 characters.")).toBeVisible();
    await expect(dialog.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  });

  test("keeps the last workspace and shows not-found for an unknown one", async ({ page }) => {
    await openStudio(page);
    await workspaceMenu(page).click();

    await expect(page.getByRole("menuitem", { name: "Delete workspace…" })).toBeDisabled();
    await page.keyboard.press("Escape");

    await page.goto("/workspaces/01890000-0000-7000-8000-000000000000");
    await expect(page.getByRole("heading", { name: "Workspace not found" })).toBeVisible();
    await page.getByRole("button", { name: "Open my workspaces" }).click();
    await expect(page).toHaveURL(WORKSPACE_URL_PATTERN);
  });

  test("shows a workspace created in another tab", async ({ page, context }) => {
    await openStudio(page);
    const otherTab = await context.newPage();
    await openStudio(otherTab);

    await createWorkspace(otherTab, "From the other tab");
    await workspaceMenu(page).click();

    await expect(page.getByRole("menuitem", { name: "From the other tab" })).toBeVisible();
  });
});
