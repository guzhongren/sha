import { expect, test } from "@playwright/test";

test.describe("code copy enhancer", () => {
  test("wraps code blocks and copies plain code text", async ({ page }) => {
    await page.goto("/posts/astro-theme");

    // Every prose pre block must be wrapped by a copy frame. Mermaid may
    // asynchronously replace its own pre, so poll until the two counts
    // converge on a stable state.
    await expect
      .poll(async () => {
        const pres = await page.locator(".prose pre").count();
        const frames = await page.locator(".code-copy-frame pre").count();
        return pres > 0 && pres === frames;
      })
      .toBe(true);

    const frame = page.locator(".code-copy-frame").first();
    const button = frame.locator(".code-copy-button");
    await expect(button).toHaveText("Copy");

    const expectedCode = (await frame.locator("pre code").textContent()) ?? "";
    expect(expectedCode.length).toBeGreaterThan(0);

    await button.click();
    await expect(button).toHaveText("Copied");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCode);

    // The label returns to "Copy" after the 1200ms timeout.
    await expect(button).toHaveText("Copy", { timeout: 5000 });
  });
});

test.describe("diagram and chart enhancers", () => {
  test("mermaid blocks render as svg diagrams", async ({ page }) => {
    await page.goto("/posts/astro-theme");
    const diagram = page.locator("figure.diagram-mermaid svg");
    await expect(diagram).toBeVisible({ timeout: 30_000 });
    await expect(diagram).toHaveAttribute("id", /^mermaid-/);
  });

  test("echarts shortcode renders a canvas instead of raw text", async ({ page }) => {
    await page.goto("/posts/2024/05/12/ECharts");

    await expect(page.locator("[data-echarts-options]")).toBeVisible();
    const canvas = page.locator("[data-echarts-options] canvas");
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("body")).not.toContainText("{{<");
  });
});

test.describe("emoji enhancer", () => {
  test("renders shortcodes as emoji outside of inline code", async ({ page }) => {
    await page.goto("/posts/2024/05/12/Emoji");

    await expect(page.locator("article > h1")).toHaveText("Emoji ✨");
    await expect(page.locator(".prose")).toContainText("🎉");
    await expect(page.locator(".prose")).toContainText("🚀");
    await expect(page.locator(".prose")).toContainText("✅");

    const inlineCode = page.locator(".prose code", { hasText: ":sparkles:" });
    await expect(inlineCode).toBeVisible();
  });
});
