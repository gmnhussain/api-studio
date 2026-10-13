import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** A studio URL: `/workspaces/` followed by a UUID. */
export const WORKSPACE_URL_PATTERN = /\/workspaces\/[0-9a-f-]{36}$/;

/** How long the first visit may take to create a workspace and redirect, under CI load. */
const FIRST_VISIT_TIMEOUT_MILLISECONDS = 15_000;

/** Cookies the app persists preferences in (ADR-0011). */
export const SETTINGS_COOKIE = "api-studio.settings";
export const LAYOUT_COOKIE = "api-studio.layout";

/**
 * Opens the studio the way a user does, through `/`, which opens (or on first run creates) the
 * last workspace. Waits until the studio and its workspace are ready.
 */
export async function openStudio(page: Page): Promise<void> {
  await page.goto("/");
  // The first visit loads IndexedDB code and creates the workspace before redirecting.
  await expect(page).toHaveURL(WORKSPACE_URL_PATTERN, {
    timeout: FIRST_VISIT_TIMEOUT_MILLISECONDS,
  });
  await expect(page.getByRole("heading", { name: "No request open" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Workspace: / })).toBeVisible();
}

/**
 * Fails on serious or critical WCAG 2.2 AA violations (docs/design/accessibility.md#testing),
 * listing each failing element with axe's explanation so the fix is obvious from the report.
 * Minor and moderate findings do not fail the run.
 */
export async function expectNoSeriousAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    serious.flatMap((violation) =>
      violation.nodes.map(
        (node) => `${violation.id} at ${node.target.join(" ")}: ${node.failureSummary ?? ""}`,
      ),
    ),
  ).toEqual([]);
}
