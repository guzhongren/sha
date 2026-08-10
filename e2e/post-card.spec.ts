import { expect, test } from "@playwright/test";
import { POSTS_PER_PAGE, fetchFeedPosts } from "./helpers";

const DESCRIPTION_SELECTOR = ".post-item p[title]";

test.describe("post list description", () => {
  for (const path of ["/", "/posts"]) {
    test(`${path} shows a non-empty two-line clamped description on every item`, async ({ page, request }) => {
      const feed = await fetchFeedPosts(request);
      await page.goto(path);

      const expectedCount = Math.min(feed.length, POSTS_PER_PAGE);
      await expect(page.locator(".post-item")).toHaveCount(expectedCount);

      const descriptions = page.locator(DESCRIPTION_SELECTOR);
      await expect(descriptions).toHaveCount(expectedCount);

      for (let index = 0; index < expectedCount; index += 1) {
        const description = descriptions.nth(index);
        const text = (await description.textContent())?.trim() ?? "";
        expect(text.length).toBeGreaterThan(0);

        // Full text is preserved in the DOM and exposed as the hover tooltip.
        expect(await description.getAttribute("title")).toBe(text);

        // Two-line clamp contract: -webkit-line-clamp: 2 with hidden overflow.
        // (Computed `display` is intentionally not asserted: Chromium resolves
        // `-webkit-box` to `flow-root`, which still clamps correctly.)
        const styles = await description.evaluate((el) => {
          const style = getComputedStyle(el);
          return { clamp: style.webkitLineClamp, overflow: style.overflow };
        });
        expect(styles).toEqual({ clamp: "2", overflow: "hidden" });
      }
    });
  }

  test("long description is truncated to two lines and keeps full text in the tooltip", async ({ page }) => {
    await page.goto("/posts");

    const card = page.locator(".post-item", { hasText: "用 Astro 构建技术博客主题" });
    const description = card.locator("p[title]");
    await expect(description).toBeVisible();

    // Content taller than the two-line box means the ellipsis is active.
    const metrics = await description.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    const fullText = (await description.textContent())?.trim() ?? "";
    expect(fullText.length).toBeGreaterThan(100);
    expect(await description.getAttribute("title")).toBe(fullText);
  });
});
