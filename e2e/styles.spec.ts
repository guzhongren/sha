import { expect, test } from "@playwright/test";

test.describe("style architecture", () => {
  test("exposes only the accent property and keeps structural decoration", async ({ page }) => {
    await page.goto("/");

    // The legacy color properties are gone; `--accent` is the single escape hatch.
    const properties = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        pageBg: style.getPropertyValue("--page-bg").trim(),
        panelBg: style.getPropertyValue("--panel-bg").trim(),
        borderSoft: style.getPropertyValue("--border-soft").trim(),
        textMuted: style.getPropertyValue("--text-muted").trim(),
        accent: style.getPropertyValue("--accent").trim(),
      };
    });
    expect(properties.pageBg).toBe("");
    expect(properties.panelBg).toBe("");
    expect(properties.borderSoft).toBe("");
    expect(properties.textMuted).toBe("");
    expect(properties.accent).not.toBe("");

    // The decorated page canvas and gutters still render from component classes.
    const canvas = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(canvas).toContain("radial-gradient");

    const gutter = page.locator(".page-gutter").first();
    await expect(gutter).toBeVisible();
    expect(await gutter.evaluate((element) => getComputedStyle(element).borderLeftWidth)).toBe("1px");

    // CSS-only decoration follows `<html data-accent>` without touching markup.
    const cornerColor = () =>
      page
        .locator(".section-frame")
        .first()
        .evaluate((element) => getComputedStyle(element, "::before").borderTopColor);

    const skyCorner = await cornerColor();
    await page.evaluate(() => {
      document.documentElement.dataset.accent = "teal";
    });
    expect(await cornerColor()).not.toBe(skyCorner);
  });

  test("keeps prose surfaces distinct from the page background", async ({ page }) => {
    await page.goto("/posts/astro-theme");

    const pageBackground = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    const codeBackground = await page
      .locator(".prose pre")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);

    expect(codeBackground).not.toBe(pageBackground);
    await expect(page.locator(".code-copy-frame").first()).toBeVisible();

    // Component state is expressed with data attributes.
    await expect(page.locator(".image-viewer-stage")).toHaveAttribute("data-grabbing", "false");
  });

  test("serves the bundled webfont for all text on the 2:1 CJK grid", async ({ page }) => {
    await page.goto("/posts/astro-theme");

    const codeFont = await page
      .locator(".prose pre")
      .first()
      .evaluate((element) => getComputedStyle(element).fontFamily);
    expect(codeFont.startsWith('"Maple Mono CN Subset"')).toBe(true);

    // The whole site renders in the bundled face, not just monospace chrome.
    const bodyFont = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).fontFamily);
    expect(bodyFont.startsWith('"Maple Mono CN Subset"')).toBe(true);
    const proseFont = await page
      .locator(".prose p")
      .first()
      .evaluate((element) => getComputedStyle(element).fontFamily);
    expect(proseFont.startsWith('"Maple Mono CN Subset"')).toBe(true);

    const metrics = await page.evaluate(async () => {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return { loaded: false, latin: 0, hanzi: 0 };
      context.font = '400 100px "Maple Mono CN Subset"';
      return {
        loaded: document.fonts.check('400 1em "Maple Mono CN Subset"'),
        latin: context.measureText("M").width,
        hanzi: context.measureText("中").width,
      };
    });
    expect(metrics.loaded).toBe(true);
    // Maple Mono gives hanzi exactly two Latin advances (1200 against 600).
    expect(metrics.hanzi / metrics.latin).toBeCloseTo(2, 1);

    // The theme declares the face inside `@layer base`, so the rule is nested
    // in a layer block instead of sitting at the top level of the stylesheet.
    const fontUrl = await page.evaluate(() => {
      const findFace = (rules: CSSRuleList): string | null => {
        for (const rule of rules) {
          if (rule instanceof CSSFontFaceRule) {
            if (rule.style.fontFamily.replace(/["']/g, "") !== "Maple Mono CN Subset") continue;
            const match = /url\(([^)]+)\)/.exec(rule.style.getPropertyValue("src"));
            if (match) return new URL(match[1].replace(/["']/g, ""), location.href).href;
          }
          const nested = (rule as CSSGroupingRule).cssRules;
          const found = nested ? findFace(nested) : null;
          if (found) return found;
        }
        return null;
      };

      for (const sheet of document.styleSheets) {
        try {
          const found = findFace(sheet.cssRules);
          if (found) return found;
        } catch {
          continue;
        }
      }
      return null;
    });
    expect(fontUrl).toMatch(/\.woff2$/);

    const response = await page.request.get(fontUrl!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("font/woff2");
  });
});
