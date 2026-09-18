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

  // PlantUML labels are painted by the PlantUML server, so the theme fetches
  // the SVG back (the public server sends `access-control-allow-origin: *`)
  // and inlines it. These tests stub the server: no network, stable markup.
  const plantUmlSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120px" height="130px" viewBox="0 0 120 130">' +
    '<g font-family="sans-serif" lengthAdjust="spacing">' +
    '<rect x="10" y="10" width="41" height="30" fill="#E2E2F0"/>' +
    '<text x="17" y="30" fill="#000" font-size="14" textLength="27">Bob</text>' +
    "</g></svg>";

  test("plantuml svg is inlined so labels use the theme font", async ({ page }) => {
    await page.route("**/plantuml/svg/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        headers: { "access-control-allow-origin": "*" },
        body: plantUmlSvg,
      }),
    );

    await page.goto("/posts/astro-theme");
    const figure = page.locator("figure.diagram-plantuml");
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute("data-diagram-font", "inline", { timeout: 30_000 });

    // The inline rule must outrank PlantUML's own `font-family` attribute.
    const labelFont = await figure
      .locator("svg text")
      .evaluate((element) => getComputedStyle(element).fontFamily);
    expect(labelFont.startsWith('"Maple Mono CN Subset"')).toBe(true);
    await expect(figure.locator("img")).toHaveCount(0);
  });

  test("plantuml keeps the server image when the response is not svg", async ({ page }) => {
    // 1x1 PNG: a raster response (or a server without CORS) has to stay a
    // non-fatal fallback, because its labels cannot be restyled.
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.route("**/plantuml/svg/**", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: pixel }),
    );

    await page.goto("/posts/astro-theme");
    const figure = page.locator("figure.diagram-plantuml");
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute("data-diagram-font", "server", { timeout: 30_000 });
    await expect(figure.locator("img")).toHaveCount(1);
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
