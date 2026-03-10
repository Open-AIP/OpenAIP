import { expect, type Browser, type Page } from "@playwright/test";
import { getE2EBaseUrl, getStorageStatePath, type RoleKey } from "./env";

export async function withRolePage<T>(
  browser: Browser,
  role: RoleKey,
  task: (page: Page) => Promise<T>
): Promise<T> {
  const context = await browser.newContext({
    baseURL: getE2EBaseUrl(),
    storageState: getStorageStatePath(role),
  });

  const page = await context.newPage();
  try {
    return await task(page);
  } finally {
    await context.close();
  }
}

export async function ensureClaimedReview(page: Page): Promise<void> {
  const claimButton = page.getByTestId("city-claim-review-button");
  if (await claimButton.isVisible().catch(() => false)) {
    await claimButton.click();
    await expect(claimButton).toBeHidden({ timeout: 20_000 });
  }
}

export async function ensureSelectValue(
  page: Page,
  triggerTestId: string,
  optionTestId: string
): Promise<void> {
  await page.getByTestId(triggerTestId).click();
  await page.getByTestId(optionTestId).click();
}
