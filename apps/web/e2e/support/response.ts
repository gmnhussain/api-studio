import { expect, type Locator, type Page } from "@playwright/test";

/**
 * How long a body may take to appear. The pretty view is the code editor, whose chunk every
 * fresh test context loads and compiles again; Firefox and WebKit take seconds for it when the
 * machine is busy. Users load it once.
 */
export const RESPONSE_BODY_TIMEOUT_MILLISECONDS = 20_000;

/** The response panel. */
export function responseRegion(page: Page): Locator {
  return page.getByRole("region", { name: "Response" });
}

/** Waits until the response body shows this text. */
export async function expectResponseBodyText(page: Page, text: string): Promise<void> {
  await expect(responseRegion(page).getByText(text)).toBeVisible({
    timeout: RESPONSE_BODY_TIMEOUT_MILLISECONDS,
  });
}
