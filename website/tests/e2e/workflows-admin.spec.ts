import { expect, test } from "@playwright/test";
import { loadScenarioForProject } from "./helpers/scenario";
import { ensureSelectValue, withRolePage } from "./helpers/ui";

test.describe.serial("Admin workflows", () => {
  test("8. Admin configure usage controls -> verify effect", async ({ browser }, testInfo) => {
    const scenario = loadScenarioForProject(testInfo.project.name);

    await withRolePage(browser, "admin", async (page) => {
      await page.goto("/admin/usage-controls?tab=chatbot", { waitUntil: "domcontentloaded" });

      await page
        .getByTestId("admin-chatbot-max-requests-input")
        .fill(String(scenario.admin.usageControls.chatbotMaxRequests));
      await ensureSelectValue(
        page,
        "admin-chatbot-time-window-trigger",
        `admin-chatbot-time-window-option-${scenario.admin.usageControls.chatbotTimeWindow}`
      );

      await page.getByTestId("admin-save-chatbot-rate-limits").click();
      await expect(page.getByTestId("admin-chatbot-rate-limit-saved")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("admin-chatbot-current-limit")).toContainText(
        String(scenario.admin.usageControls.chatbotMaxRequests)
      );
    });
  });

  test("9. Admin view audit logs with recent entries", async ({ browser }) => {
    await withRolePage(browser, "admin", async (page) => {
      await page.goto("/admin/audit-logs", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("admin-audit-table")).toBeVisible();
      await expect(page.getByTestId("admin-audit-row").first()).toBeVisible();
    });
  });

  test("10. Admin create LGU account (idempotent)", async ({ browser }, testInfo) => {
    const scenario = loadScenarioForProject(testInfo.project.name);
    const email = scenario.admin.createLguAccount.email.toLowerCase();

    await withRolePage(browser, "admin", async (page) => {
      await page.goto("/admin/account-administration", { waitUntil: "domcontentloaded" });

      await page.getByTestId("admin-account-search").fill(email);
      const existing = page.locator(`[data-account-email=\"${email}\"]`);
      if ((await existing.count()) === 0) {
        await page.getByTestId("admin-create-official-account-button").click();
        await page.getByTestId("admin-create-official-full-name").fill(
          scenario.admin.createLguAccount.fullName
        );
        await page.getByTestId("admin-create-official-email").fill(
          scenario.admin.createLguAccount.email
        );

        await ensureSelectValue(
          page,
          "admin-create-official-role-trigger",
          `admin-create-official-role-option-${scenario.admin.createLguAccount.role}`
        );
        await ensureSelectValue(
          page,
          "admin-create-official-lgu-trigger",
          `admin-create-official-lgu-option-${scenario.admin.createLguAccount.lguKey}`
        );

        await page.getByTestId("admin-create-official-submit").click();
        await page.getByTestId("admin-account-search").fill(email);
      }

      await expect(existing.first()).toBeVisible({ timeout: 20_000 });
    });
  });

  test("11. Admin add LGU entity (idempotent)", async ({ browser }, testInfo) => {
    const scenario = loadScenarioForProject(testInfo.project.name);
    const lguCode = scenario.admin.addLgu.code;

    await withRolePage(browser, "admin", async (page) => {
      await page.goto("/admin/lgu-management", { waitUntil: "domcontentloaded" });

      await page.getByTestId("admin-lgu-search").fill(lguCode);
      const existing = page.locator(`[data-lgu-code=\"${lguCode}\"]`);

      if ((await existing.count()) === 0) {
        await page.getByTestId("admin-add-lgu-button").click();

        await ensureSelectValue(
          page,
          "admin-add-lgu-type-trigger",
          `admin-add-lgu-type-option-${scenario.admin.addLgu.type}`
        );
        await page.getByTestId("admin-add-lgu-name").fill(scenario.admin.addLgu.name);
        await page.getByTestId("admin-add-lgu-code").fill(scenario.admin.addLgu.code);

        if (scenario.admin.addLgu.regionId) {
          await ensureSelectValue(
            page,
            "admin-add-lgu-region-trigger",
            `admin-add-lgu-region-option-${scenario.admin.addLgu.regionId}`
          );
        }

        if (scenario.admin.addLgu.provinceId) {
          await ensureSelectValue(
            page,
            "admin-add-lgu-province-trigger",
            `admin-add-lgu-province-option-${scenario.admin.addLgu.provinceId}`
          );
        }

        if (scenario.admin.addLgu.parentType) {
          await ensureSelectValue(
            page,
            "admin-add-lgu-parent-type-trigger",
            `admin-add-lgu-parent-type-option-${scenario.admin.addLgu.parentType}`
          );
        }

        if (scenario.admin.addLgu.parentId) {
          await ensureSelectValue(
            page,
            "admin-add-lgu-parent-trigger",
            `admin-add-lgu-parent-option-${scenario.admin.addLgu.parentId}`
          );
        }

        await page.getByTestId("admin-add-lgu-submit").click();
        await page.getByTestId("admin-lgu-search").fill(lguCode);
      }

      await expect(existing.first()).toBeVisible({ timeout: 20_000 });
    });
  });
});
