import { expect, test, type Page } from "@playwright/test";

import { openNewRequest, openSection, urlInput } from "./support/request-editor";
import { expectNoSeriousAccessibilityViolations, openStudio } from "./support/studio";
import { testApiUrl } from "./support/test-api";

function responseRegion(page: Page) {
  return page.getByRole("region", { name: "Response" });
}

function consoleRegion(page: Page) {
  return page.getByRole("region", { name: "Console" });
}

async function send(page: Page, url: string): Promise<void> {
  await urlInput(page).fill(url);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

test.describe("sending requests", () => {
  test("sends through the proxy and shows status, body, headers and a console entry", async ({
    page,
  }) => {
    await openStudio(page);
    await openNewRequest(page);

    await send(page, testApiUrl("/users/1?expand=posts"));

    const response = responseRegion(page);
    await expect(response.getByText("200 OK")).toBeVisible();
    await expect(response.getByText('"name":"Ada Lovelace"')).toBeVisible();
    await response.getByRole("tab", { name: /Headers/ }).click();
    await expect(response.getByText("content-type")).toBeVisible();
    await expect(
      consoleRegion(page).getByText(/GET http:\/\/127\.0\.0\.1:3201\/users\/1.*→ 200/),
    ).toBeVisible();
  });

  test("keeps cookies from responses and sends them with later requests", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await send(page, testApiUrl("/login"));
    await expect(responseRegion(page).getByText("200 OK")).toBeVisible();
    await send(page, testApiUrl("/me"));

    await expect(responseRegion(page).getByText('"cookie":"session=e2e-session"')).toBeVisible();
  });

  test("follows redirects to the final response", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await send(page, testApiUrl("/redirect"));

    await expect(responseRegion(page).getByText('"id":1')).toBeVisible();
  });

  test("cancels a slow request with Esc, and times out", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await send(page, testApiUrl("/slow"));
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(responseRegion(page).getByText("Request cancelled")).toBeVisible();

    await openSection(page, "Settings");
    await page.getByLabel("Timeout").fill("300");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(responseRegion(page).getByText("The request timed out")).toBeVisible();
  });

  test("explains requests that cannot be sent or reach nothing", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);

    await send(page, "{{missing}}/users");
    await expect(responseRegion(page).getByText("Some variables have no value")).toBeVisible();

    await send(page, "http://127.0.0.1:1/");
    await expect(responseRegion(page).getByText("Could not connect")).toBeVisible();
    await expect(responseRegion(page).getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("sends from the browser in browser mode", async ({ page }) => {
    await openStudio(page);
    await page.getByRole("button", { name: "Send through: Proxy" }).click();
    await page.getByRole("menuitemradio", { name: "Browser" }).click();
    await expect(page.getByRole("button", { name: "Send through: Browser" })).toBeVisible();
    await openNewRequest(page);

    await send(page, testApiUrl("/users/1"));

    await expect(responseRegion(page).getByText("200 OK")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Send through: Browser" })).toBeVisible();
  });

  test("the response and console have no serious WCAG 2.2 AA violations", async ({ page }) => {
    await openStudio(page);
    await openNewRequest(page);
    await send(page, testApiUrl("/users/1"));
    await expect(responseRegion(page).getByText("200 OK")).toBeVisible();

    await expectNoSeriousAccessibilityViolations(page);
    await send(page, testApiUrl("/missing"));
    await expect(responseRegion(page).getByText("404 Not Found")).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });
});
