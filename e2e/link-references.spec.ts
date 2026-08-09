import { expect, test } from "@playwright/test";

test.describe("link references", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/2024/05/12/links");
  });

  test("numbers external links in document order", async ({ page }) => {
    const marks = page.locator(".prose a .ref-mark");
    await expect(marks).toHaveCount(3);
    await expect(marks.nth(0)).toHaveText("[1]");
    await expect(marks.nth(1)).toHaveText("[2]");
    await expect(marks.nth(2)).toHaveText("[3]");

    const astroLinks = page.locator('.prose > :not(.post-references) a[href="https://astro.build/"]');
    await expect(astroLinks).toHaveCount(2);
    await expect(astroLinks.nth(0).locator(".ref-mark")).toHaveText("[1]");
    await expect(astroLinks.nth(1).locator(".ref-mark")).toHaveText("[3]");
    await expect(page.locator('.prose > :not(.post-references) a[href="https://mdxjs.com/"] .ref-mark')).toHaveText("[2]");
  });

  test("does not number internal, mailto, image, or code links", async ({ page }) => {
    await expect(page.locator('a[href="/posts/no-cover"] .ref-mark')).toHaveCount(0);
    await expect(page.locator('a[href="mailto:hello@example.com"] .ref-mark')).toHaveCount(0);
    await expect(page.locator('a[href="https://example.com/image"] .ref-mark')).toHaveCount(0);
    await expect(page.locator('a[href="https://example.com/in-code"]')).toHaveCount(0);
  });

  test("renders a references section with text: url entries", async ({ page }) => {
    const section = page.locator(".post-references");
    await expect(section).toBeVisible();
    await expect(section.locator(".post-references-title")).toHaveText("参考");

    const items = section.locator(".post-references-list li");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("Astro 官网: https://astro.build/");
    await expect(items.nth(1)).toContainText("MDX 文档: https://mdxjs.com/");
    await expect(items.nth(2)).toContainText("Astro 官网: https://astro.build/");
  });

  test("omits the references section when a post has no external links", async ({ page }) => {
    await page.goto("/posts/2024/05/12/test");
    await expect(page.locator(".post-references")).toHaveCount(0);
    await expect(page.locator(".ref-mark")).toHaveCount(0);
  });

  test("superscripts and references are present in static HTML without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/posts/2024/05/12/links");

    await expect(page.locator(".prose a .ref-mark")).toHaveCount(3);
    await expect(page.locator(".post-references")).toBeVisible();
    await context.close();
  });
});
