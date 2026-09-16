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
});
