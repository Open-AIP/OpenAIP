import { expect, test } from "@playwright/test";
import { loadScenarioForProject } from "./helpers/scenario";
import { ensureSelectValue, withRolePage } from "./helpers/ui";

test.describe.serial("Citizen workflows", () => {
  test("6. Citizen browse published AIP -> detail/projects/budget allocation", async ({ browser }, testInfo) => {
    const scenario = loadScenarioForProject(testInfo.project.name);

    await withRolePage(browser, "citizen", async (page) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.getByTestId("citizen-nav-aips").click();
      await expect(page).toHaveURL(/\/aips(?:$|[/?#])/);

      const card = page.getByTestId(`citizen-aip-card-${scenario.aipWorkflow.publishedAipId}`);
      await expect(card).toBeVisible();
      await card.getByTestId(`citizen-aip-view-details-${scenario.aipWorkflow.publishedAipId}`).click();

      await expect(page).toHaveURL(
        new RegExp(`/aips/${scenario.aipWorkflow.publishedAipId}(?:$|[/?#])`)
      );
      await expect(page.getByTestId("citizen-aip-overview-card")).toBeVisible();
      await expect(page.getByTestId("citizen-aip-projects-table")).toBeVisible();

      await page.getByTestId("citizen-nav-budget-allocation").click();
      await expect(page).toHaveURL(/\/budget-allocation(?:$|[/?#])/);
      await expect(page.getByTestId("citizen-budget-allocation-overview-header")).toBeVisible();
    });
  });

  test("7. Citizen submit feedback", async ({ browser }, testInfo) => {
    const scenario = loadScenarioForProject(testInfo.project.name);

    await withRolePage(browser, "citizen", async (page) => {
      await page.goto(`/aips/${scenario.aipWorkflow.publishedAipId}?tab=feedback`, {
        waitUntil: "domcontentloaded",
      });
      const feedbackThreads = page.getByTestId("citizen-feedback-thread");
      const initialThreadCount = await feedbackThreads.count();

      await ensureSelectValue(page, "feedback-kind-trigger", "feedback-kind-option-question");
      await page.getByTestId("feedback-message-input").fill(scenario.citizen.feedbackMessage);
      await page.getByTestId("feedback-submit-button").click();

      await expect
        .poll(async () => page.getByTestId("citizen-feedback-thread").count(), {
          timeout: 30_000,
        })
        .toBeGreaterThan(initialThreadCount);
    });
  });
});
