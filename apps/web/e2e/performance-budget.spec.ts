import { expect, test, type Page } from "@playwright/test";

import {
  readLargestContentfulPaint,
  recordLargestContentfulPaint,
} from "./support/largest-contentful-paint";
import { readCumulativeLayoutShift, recordLayoutShifts } from "./support/layout-shift";
import { openStudio } from "./support/studio";

/**
 * Budgets from docs/development/performance.md#budgets. Initial JavaScript is what a modern
 * browser downloads for the server HTML: its script tags, minus `nomodule` legacy polyfills, and
 * not the chunks loaded on demand afterwards.
 */
const INITIAL_JAVASCRIPT_BUDGET_BYTES = 290 * 1024;
const CUMULATIVE_LAYOUT_SHIFT_BUDGET = 0.02;
const LARGEST_CONTENTFUL_PAINT_BUDGET_MILLISECONDS = 1500;

/** Script URLs a modern browser loads from the server HTML. */
function readInitialScriptPaths(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => !/\bnomodule\b/i.test(tag))
    .map((tag) => /\bsrc="([^"]+)"/.exec(tag)?.[1])
    .filter((source): source is string => source !== undefined);
}

/**
 * Opens the studio as a returning user: a first visit creates the workspace and its cookie,
 * then the measured visit loads `/`, which redirects on the server. `recorder` is installed for
 * the measured visit only.
 */
async function openReturningVisit(page: Page, recorder?: () => void): Promise<void> {
  await openStudio(page);
  if (recorder) await page.addInitScript(recorder);
  await openStudio(page);
  await page.waitForLoadState("networkidle");
}

test.describe("performance budget", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Resource sizes and layout shifts are measured in Chromium",
  );

  test("the studio's initial JavaScript stays within budget", async ({ page }) => {
    await openReturningVisit(page);
    const html = await (await page.request.get(page.url())).text();
    const initialScripts = new Set(readInitialScriptPaths(html));
    expect(initialScripts.size).toBeGreaterThan(0);

    const transferredBytes = await page.evaluate(
      (paths) =>
        performance
          .getEntriesByType("resource")
          .filter((entry) => entry instanceof PerformanceResourceTiming)
          .filter((entry) => paths.includes(new URL(entry.name).pathname))
          .reduce((total, entry) => total + entry.encodedBodySize, 0),
      [...initialScripts],
    );

    test.info().annotations.push({
      type: "initial JavaScript",
      description: `${(transferredBytes / 1024).toFixed(1)} KB compressed in ${String(initialScripts.size)} scripts`,
    });
    expect(transferredBytes).toBeLessThanOrEqual(INITIAL_JAVASCRIPT_BUDGET_BYTES);
  });

  test("the studio paints its largest content within 1.5 s", async ({ page }) => {
    await openReturningVisit(page, recordLargestContentfulPaint);

    const largestContentfulPaint = await page.evaluate(readLargestContentfulPaint);
    test.info().annotations.push({
      type: "largest contentful paint",
      description: `${String(Math.round(largestContentfulPaint ?? 0))} ms`,
    });
    expect(largestContentfulPaint).toBeDefined();
    expect(largestContentfulPaint ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
      LARGEST_CONTENTFUL_PAINT_BUDGET_MILLISECONDS,
    );
  });

  test("the studio does not shift its layout while loading", async ({ page }) => {
    await openReturningVisit(page, recordLayoutShifts);

    expect(await page.evaluate(readCumulativeLayoutShift)).toBeLessThan(
      CUMULATIVE_LAYOUT_SHIFT_BUDGET,
    );
  });
});
