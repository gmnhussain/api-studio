import { expect, type Locator, type Page } from "@playwright/test";

/** The strip of open tabs. */
export function tabStrip(page: Page): Locator {
  return page.getByRole("list", { name: "Open requests" });
}

/** The tab buttons in the strip, in order. */
export function tabButtons(page: Page): Locator {
  return tabStrip(page).locator("[data-slot=editor-tab]");
}

/** The tab that is showing. */
export function activeTab(page: Page): Locator {
  return tabStrip(page).locator("button[aria-current='true']");
}

/** The URL field of the request that is showing. */
export function urlInput(page: Page): Locator {
  return page.getByRole("combobox", { name: "Request URL" });
}

/** Opens a new request tab with the button and waits for its editor. */
export async function openNewRequest(page: Page): Promise<void> {
  const count = await tabButtons(page).count();
  await page.getByRole("button", { name: "New request" }).first().click();
  await expect(tabButtons(page)).toHaveCount(count + 1);
  await expect(urlInput(page)).toBeVisible();
}

/** Picks a request section (Params, Auth, Headers, Body, Cookies, Settings). */
export async function openSection(page: Page, name: string): Promise<void> {
  await page.getByRole("tab", { name: new RegExp(`^${name}`) }).click();
}

/** Saves a request that was never saved, into a new collection, under a name. */
export async function saveAsNew(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Save request" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(`Saved “${name}”`)).toBeVisible();
}

/** What IndexedDB holds for the open tabs: how many, how many pinned, and each draft's URL. */
async function readStoredSession(
  page: Page,
): Promise<{ tabs: number; pinned: number; urls: string[] }> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("api-studio");
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(new Error("could not open the database"));
      };
    });
    const readAll = (table: string) =>
      new Promise<unknown[]>((resolve) => {
        const request = database.transaction(table).objectStore(table).getAll();
        request.onsuccess = () => {
          resolve(request.result as unknown[]);
        };
      });
    const [layouts, drafts] = await Promise.all([readAll("tabLayouts"), readAll("drafts")]);
    database.close();
    const storedTabs = layouts.flatMap(
      (layout) => (layout as { tabs: { isPinned: boolean }[] }).tabs,
    );
    const urls = drafts.map((draft) => (draft as { request: { url: string } }).request.url);
    return {
      tabs: storedTabs.length,
      pinned: storedTabs.filter((tab) => tab.isPinned).length,
      urls,
    };
  });
}

/**
 * Waits until auto-save has written the open tabs, their pins and the URLs shown: tabs and
 * drafts are saved shortly after changes stop, so a reload right away would otherwise race it.
 */
export async function waitForAutoSave(page: Page, expectedUrls: readonly string[]): Promise<void> {
  const tabs = await tabButtons(page).count();
  const pinned = await tabStrip(page).locator("li[data-pinned]").count();
  await expect
    .poll(async () => {
      const stored = await readStoredSession(page);
      return (
        stored.tabs === tabs &&
        stored.pinned === pinned &&
        expectedUrls.every((url) => stored.urls.includes(url))
      );
    })
    .toBe(true);
}
