import { expect, test } from "@playwright/test";

async function readTransform(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const image = document.querySelector<HTMLImageElement>("[data-image-viewer-image]");
    if (!image) throw new Error("viewer image not found");
    const matrix = new DOMMatrix(getComputedStyle(image).transform);
    return { scale: matrix.a, tx: matrix.e, ty: matrix.f };
  });
}

test.describe("image viewer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/astro-theme");
  });

  test("opens the viewer on click and closes with Escape", async ({ page }) => {
    const trigger = page.locator(".image-lightbox-trigger");
    await expect(trigger).toHaveCount(1);

    await trigger.click();
    const dialog = page.locator("[data-image-viewer-dialog]");
    await expect(dialog).toHaveAttribute("open", "");
    const image = dialog.locator("[data-image-viewer-image]");
    await expect(image).toHaveAttribute("src", /viewer-sample\.svg$/);
    await expect(image).toHaveAttribute("alt", "viewer sample");

    await page.keyboard.press("Escape");
    await expect(dialog).not.toHaveAttribute("open", "");
    await expect(trigger).toBeFocused();
  });

  test("wheel zooms and dragging pans the image", async ({ page }) => {
    await page.locator(".image-lightbox-trigger").click();

    const fit = await readTransform(page);
    expect(fit.scale).toBeCloseTo(1, 2);

    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, -240);
    const zoomed = await readTransform(page);
    expect(zoomed.scale).toBeGreaterThan(1.2);

    const beforeDrag = await readTransform(page);
    await page.mouse.move(640, 400);
    await page.mouse.down();
    await page.mouse.move(760, 460, { steps: 5 });
    await page.mouse.up();
    const panned = await readTransform(page);
    expect(panned.tx).toBeGreaterThan(beforeDrag.tx + 50);
    expect(panned.ty).toBeGreaterThan(beforeDrag.ty + 20);
  });

  test("double-click toggles between fit and zoomed", async ({ page }) => {
    await page.locator(".image-lightbox-trigger").click();

    await page.mouse.dblclick(640, 400);
    const zoomed = await readTransform(page);
    expect(zoomed.scale).toBeCloseTo(2.5, 2);

    await page.mouse.dblclick(640, 400);
    const reset = await readTransform(page);
    expect(reset.scale).toBeCloseTo(1, 2);
  });

  test("cover, diagram, and linked images are not wrapped", async ({ page }) => {
    // The cover image stays a plain img above the prose content.
    await expect(page.locator("article > img[src='/covers/astro-theme.svg']")).toBeVisible();

    // PlantUML figures are created client-side as an `<img>` and upgraded to
    // inline SVG once they scroll into view; either way they stay unwrapped.
    const plantuml = page.locator("figure.diagram-plantuml");
    await expect(plantuml.locator("img, svg")).toHaveCount(1, { timeout: 30_000 });
    expect(await plantuml.evaluate((figure) => !figure.closest(".image-lightbox-trigger"))).toBe(true);

    // Only the sample content image becomes a trigger; diagram output is excluded.
    const triggers = await page.locator(".prose .image-lightbox-trigger").count();
    const wrappedImages = await page.locator(".prose .image-lightbox-trigger img").count();
    expect(triggers).toBe(1);
    expect(wrappedImages).toBe(1);
  });
});
