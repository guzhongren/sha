import { expect, test } from "@playwright/test";

// This spec only runs in the mobile-chromium project (see playwright.config.ts).
test.describe("mobile layout", () => {
  test("collapses primary nav but keeps search and theme controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("nav.header-nav")).toBeHidden();
    await expect(page.locator("header [data-search-trigger]").last()).toBeVisible();
    await expect(page.locator("header [data-theme-toggle]").last()).toBeVisible();

    await page.locator("header [data-search-trigger]").last().click();
    await expect(page.locator("[data-search-dialog]")).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
  });

  test("main content is not hidden under the fixed header", async ({ page }) => {
    await page.goto("/");

    const headerBox = (await page.locator("header").boundingBox())!;
    const mainBox = (await page.locator("#main-content").boundingBox())!;
    expect(mainBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
  });

  test("pages do not overflow horizontally", async ({ page }) => {
    for (const path of ["/", "/posts", "/posts/astro-theme"]) {
      await page.goto(path);
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      expect(fits, `${path} overflows horizontally`).toBe(true);
    }
  });

  test("footer navigation stays reachable and works", async ({ page }) => {
    await page.goto("/");

    // force: on tall pages, headless Chromium's device-emulation hit test can
    // report the footer container as intercepting even though the link is not
    // covered; a forced click still verifies that navigation works.
    await page.locator("footer").getByRole("link", { name: "About" }).click({ force: true });
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("谷中仁的博客");
  });
});
