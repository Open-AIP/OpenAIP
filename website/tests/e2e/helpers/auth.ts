import { expect, type Page } from "@playwright/test";
import { getE2EBaseUrl, getRoleCredentials, type RoleKey } from "./env";

async function loginStaffRole(page: Page, role: Exclude<RoleKey, "citizen">): Promise<void> {
  const { email, password } = getRoleCredentials(role);
  const baseURL = getE2EBaseUrl();

  await page.goto(`${baseURL}/${role}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("auth-login-email").fill(email);
  await page.getByTestId("auth-login-password").fill(password);
  await page.getByTestId("auth-login-submit").click();

  await expect(page).toHaveURL(new RegExp(`/${role}(?:$|[/?#])`), {
    timeout: 30_000,
  });
}

async function loginCitizen(page: Page): Promise<void> {
  const { email, password } = getRoleCredentials("citizen");
  const baseURL = getE2EBaseUrl();

  await page.goto(`${baseURL}/?auth=login&authStep=email&next=/`, {
    waitUntil: "domcontentloaded",
  });

  await page.getByTestId("citizen-auth-email-input").fill(email);
  await page.getByTestId("citizen-auth-password-input").fill(password);
  await page.getByTestId("citizen-auth-submit").click();

  await expect(page.getByTestId("citizen-nav-account-trigger")).toBeVisible({
    timeout: 30_000,
  });
}

export async function loginAsRole(page: Page, role: RoleKey): Promise<void> {
  if (role === "citizen") {
    await loginCitizen(page);
    return;
  }
  await loginStaffRole(page, role);
}
