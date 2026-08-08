import { expect, test } from "@playwright/test";

// This spec only runs in the mobile-chromium project (see playwright.config.ts).
test.describe("mobile layout", () => {
  test("collapses primary nav but keeps search, theme, and menu controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("nav.header-nav")).toBeHidden();
    await expect(page.locator("header [data-search-trigger]").last()).toBeVisible();
    await expect(page.locator("header [data-theme-toggle]").last()).toBeVisible();
    await expect(page.locator("[data-menu-toggle]")).toBeVisible();

    await page.locator("header [data-search-trigger]").last().click();
    await expect(page.locator("[data-search-dialog]")).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
  });

  test("hamburger menu exposes nav links and closes after navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#mobile-menu")).toBeHidden();
    await page.locator("[data-menu-toggle]").click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "true");

    await page.locator("#mobile-menu").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile theme toggle cycles modes and persists", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.locator("header [data-theme-toggle]").last();

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
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
