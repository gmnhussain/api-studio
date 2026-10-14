import { expect, test, type Page } from "@playwright/test";

import { openNewRequest, urlInput } from "./support/request-editor";
import {
  expectResponseBodyText,
  RESPONSE_BODY_TIMEOUT_MILLISECONDS,
  responseRegion,
} from "./support/response";
import { expectNoSeriousAccessibilityViolations, openStudio } from "./support/studio";
import { testApiUrl } from "./support/test-api";

/** Size of the large body, the M5 exit criterion (milestones.md#m5--response-viewer). */
const LARGE_BODY_MEGABYTES = 20;

/** The longest the main thread may be blocked at once while a large body is explored. */
const LONGEST_TASK_BUDGET_MILLISECONDS = 200;

async function send(page: Page, url: string): Promise<void> {
  await urlInput(page).fill(url);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

async function openStudioAndSend(page: Page, path: string): Promise<void> {
  await openStudio(page);
  await openNewRequest(page);
  await send(page, testApiUrl(path));
  await expect(responseRegion(page).getByText("200 OK")).toBeVisible();
}

test.describe("response viewer", () => {
  // WebKit compiles the code editor chunk far slower than the other engines (request-builder).
  test.slow(({ browserName }) => browserName === "webkit", "WebKit loads the code editor slowly");

  test("shows JSON pretty, as a tree and raw, and copies a path", async ({
    page,
    context,
    browserName,
  }) => {
    await openStudioAndSend(page, "/users/1?expand=posts");
    const response = responseRegion(page);
    await expectResponseBodyText(page, '"name": "Ada Lovelace"');

    await response.getByRole("button", { name: "Tree" }).click();
    const tree = response.getByRole("tree", { name: "JSON tree" });
    await expect(tree.getByRole("treeitem")).toHaveCount(3);
    await tree.focus();
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowRight");
    await expect(tree.getByRole("treeitem", { name: /"expand": "posts"/ })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);

    // Only Chromium lets a test grant clipboard access.
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await tree.getByRole("treeitem", { name: /"expand"/ }).click({ button: "right" });
      await page.getByRole("menuitem", { name: "Copy path" }).click();
      await expect(page.getByText("Path copied")).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("$.query.expand");
    }

    await response.getByRole("button", { name: "Raw" }).click();
    await expectResponseBodyText(page, '{"id":1,"name":"Ada Lovelace"');
  });

  test("filters headers, lists cookies and shows the redirect chain", async ({ page }) => {
    await openStudioAndSend(page, "/login");
    const response = responseRegion(page);

    await response.getByRole("tab", { name: /Headers/ }).click();
    await response.getByRole("searchbox", { name: "Filter headers" }).fill("set-cookie");
    await expect(response.getByRole("cell", { name: "set-cookie" })).toBeVisible();
    await expect(response.getByRole("cell", { name: "content-type" })).toBeHidden();

    await response.getByRole("tab", { name: /Cookies/ }).click();
    const cookie = response.getByRole("row", { name: /session/ });
    await expect(cookie.getByText("HttpOnly")).toBeVisible();

    await send(page, testApiUrl("/redirect"));
    await response.getByRole("tab", { name: "Timeline" }).click();
    await expect(response.getByRole("heading", { name: "1 redirect" })).toBeVisible();
    await expect(response.getByText(`GET ${testApiUrl("/redirect")}`)).toBeVisible();
    await expect(response.getByText(testApiUrl("/users/1"), { exact: true })).toBeVisible();
  });

  test("previews HTML in a sandbox where its scripts never run", async ({ page }) => {
    await openStudioAndSend(page, "/page.html");
    await responseRegion(page).getByRole("button", { name: "Preview" }).click();

    const preview = page.frameLocator('iframe[title="HTML preview of the response"]');
    await expect(preview.getByRole("heading", { name: "Hello preview" })).toBeVisible({
      timeout: RESPONSE_BODY_TIMEOUT_MILLISECONDS,
    });
  });

  test("previews images and Markdown", async ({ page }) => {
    await openStudioAndSend(page, "/pixel.png");
    const response = responseRegion(page);
    await expect(response.getByRole("img", { name: "The response image" })).toBeVisible();
    await expect(response.getByText(/image\/png · 1 × 1/)).toBeVisible();

    await send(page, testApiUrl("/readme.md"));
    await response.getByRole("button", { name: "Preview" }).click();
    await expect(response.getByRole("heading", { name: "Release notes" })).toBeVisible();
  });

  test("downloads a body under the name the response suggests", async ({ page }) => {
    await openStudioAndSend(page, "/report");
    const download = page.waitForEvent("download");
    await responseRegion(page).getByRole("button", { name: "Download" }).click();
    expect((await download).suggestedFilename()).toBe("report.csv");
  });

  test(`a ${String(LARGE_BODY_MEGABYTES)} MB JSON response stays responsive`, async ({
    page,
    browserName,
  }) => {
    // Long tasks are observable only in Chromium, and moving the body through every engine at
    // once would starve the tests running beside it; the views are the same code everywhere.
    test.skip(browserName !== "chromium", "Long tasks are measured in Chromium");
    test.slow();
    await openStudio(page);
    await openNewRequest(page);
    await send(page, testApiUrl(`/large.json?megabytes=${String(LARGE_BODY_MEGABYTES)}`));
    const response = responseRegion(page);
    await expect(response.getByText("200 OK")).toBeVisible({ timeout: 60_000 });

    await page.evaluate(() => {
      const durations: number[] = [];
      Object.assign(window, { longTaskDurations: durations });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) durations.push(entry.duration);
      }).observe({ type: "longtask" });
    });

    // Pretty: formatted in the worker, shown row by row.
    const pretty = response.getByRole("textbox", { name: "Response body, formatted" });
    await expect(pretty).toBeVisible({ timeout: 30_000 });
    await expect(pretty.getByText('"name": "User 0",')).toBeVisible();

    // Tree: parsed in the worker, one level at a time.
    await response.getByRole("button", { name: "Tree" }).click();
    const tree = response.getByRole("tree", { name: "JSON tree" });
    await expect(tree.getByRole("treeitem").first()).toBeVisible({ timeout: 30_000 });
    await tree.focus();
    await page.keyboard.press("ArrowRight");
    await expect(tree.getByRole("treeitem", { level: 2 }).first()).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(tree.getByRole("treeitem", { level: 3 }).first()).toBeVisible();
    await page.keyboard.press("End");

    // Raw: the text as received, scrolled to the end.
    await response.getByRole("button", { name: "Raw" }).click();
    const raw = response.getByRole("textbox", { name: "Response body, as received" });
    await expect(raw).toBeVisible();
    await raw.focus();
    await page.keyboard.press("End");
    await expect(raw.getByText(/\}\]$/)).toBeVisible();

    // Typing still answers at once.
    await urlInput(page).press("End");
    await urlInput(page).pressSequentially("&x=1");
    await expect(urlInput(page)).toHaveValue(/&x=1$/);

    const longest = await page.evaluate(() =>
      Math.max(0, ...(window as unknown as { longTaskDurations: number[] }).longTaskDurations),
    );
    test.info().annotations.push({ type: "longest task (ms)", description: String(longest) });
    expect(longest).toBeLessThan(LONGEST_TASK_BUDGET_MILLISECONDS);
  });
});
