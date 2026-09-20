import { expect, test } from "@playwright/test";
import { plantumlBlocks } from "./helpers";

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

    // Line numbers are generated chrome: the clipboard must start with code.
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^import/);

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

    // Mermaid writes its own <style> into the SVG, so the theme font has to be
    // injected through the mermaid config rather than inherited from the page.
    const diagramFont = await diagram.evaluate((element) => ({
      computed: getComputedStyle(element).fontFamily,
      inline: [...element.querySelectorAll("style")].map((style) => style.textContent ?? "").join("\n"),
    }));
    expect(diagramFont.computed.startsWith('"Maple Mono CN Subset"')).toBe(true);
    expect(diagramFont.inline).toContain("Maple Mono CN Subset");
  });

  test("plantuml blocks are drawn in the browser, with no server involved", async ({ page }) => {
    // The engine ships with the theme, so a diagram must never reach a server.
    const plantumlRequests: string[] = [];
    page.on("request", (request) => {
      if (/plantuml/i.test(request.url()) && !request.url().startsWith("http://127.0.0.1:")) {
        plantumlRequests.push(request.url());
      }
    });

    await page.goto("/posts/astro-theme");
    // Loading the engine is deferred until a diagram nears the viewport; every
    // block on the page is then drawn, including the ones below the fold.
    const blocks = plantumlBlocks(page);
    const blockCount = await blocks.count();
    expect(blockCount).toBeGreaterThan(0);
    await blocks.first().scrollIntoViewIfNeeded();

    const figures = page.locator("figure.diagram-plantuml");
    await expect(figures).toHaveCount(blockCount, { timeout: 60_000 });
    for (const figure of await figures.all()) {
      await expect(figure.locator("svg")).toBeVisible();
      // A drawn diagram carries its own labels and no leftover code block.
      expect(await figure.locator("svg text").count()).toBeGreaterThan(0);
      await expect(figure.locator("img, pre")).toHaveCount(0);
    }
    await expect(blocks).toHaveCount(0);
    await expect(page.locator('pre[data-diagram-error="plantuml"]')).toHaveCount(0);
    expect(plantumlRequests).toEqual([]);
  });

  test("plantuml diagrams are drawn for the active theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/posts/astro-theme");

    await plantumlBlocks(page).first().scrollIntoViewIfNeeded();
    const figure = page.locator("figure.diagram-plantuml").first();
    await expect(figure).toHaveAttribute("data-diagram-theme", "dark", { timeout: 60_000 });

    // Dark output paints light labels, so this cannot be the light diagram.
    await expect(figure.locator("svg text").first()).toHaveAttribute("fill", "#FFFFFF");
  });

  test("echarts shortcode renders a canvas instead of raw text", async ({ page }) => {
    await page.goto("/posts/2024/05/12/echarts");

    const container = page.locator("[data-echarts-options]");
    await expect(container).toBeVisible();
    const canvas = page.locator("[data-echarts-options] canvas");
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("body")).not.toContainText("{{<");

    // Canvas text cannot be inspected, so the chart records the stack it was
    // configured with; it must be the container's own (theme) font.
    const fonts = await container.evaluate((element) => ({
      applied: element.getAttribute("data-chart-font"),
      computed: getComputedStyle(element).fontFamily,
    }));
    expect(fonts.applied).toBe(fonts.computed);
    expect(fonts.applied?.startsWith('"Maple Mono CN Subset"')).toBe(true);
  });
});

test.describe("emoji enhancer", () => {
  test("renders shortcodes as emoji outside of inline code", async ({ page }) => {
    await page.goto("/posts/2024/05/12/emoji");

    await expect(page.locator("article > h1")).toHaveText("Emoji ✨");
    await expect(page.locator(".prose")).toContainText("🎉");
    await expect(page.locator(".prose")).toContainText("🚀");
    await expect(page.locator(".prose")).toContainText("✅");

    const inlineCode = page.locator(".prose code", { hasText: ":sparkles:" });
    await expect(inlineCode).toBeVisible();
  });
});
