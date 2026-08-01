import { expect, test } from "@playwright/test";
import { DRAFT_TITLE, POSTS_PER_PAGE, fetchFeedPosts } from "./helpers";

test.describe("posts listing", () => {
  test("shows published posts in feed order without drafts", async ({ page, request }) => {
    const feed = await fetchFeedPosts(request);
    expect(feed.length).toBeGreaterThan(0);

    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();

    const expectedCount = Math.min(feed.length, POSTS_PER_PAGE);
    await expect(page.locator(".post-item")).toHaveCount(expectedCount);
    await expect(page.locator("body")).not.toContainText(DRAFT_TITLE);
  });

  test("pagination appears only when there are more posts than postsPerPage", async ({ page, request }) => {
    const feed = await fetchFeedPosts(request);
    await page.goto("/posts");

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    if (feed.length > POSTS_PER_PAGE) {
      await expect(pagination).toBeVisible();
      await expect(pagination).toContainText("Page 1 of");
      const response = await page.request.get("/posts/page/2");
      expect(response.status()).toBe(200);
    } else {
      await expect(pagination).toHaveCount(0);
      const response = await page.request.get("/posts/page/2");
      expect(response.status()).toBe(404);
    }
  });
});

test.describe("post detail page", () => {
  test("renders metadata, tags, cover, and pagefind body", async ({ page }) => {
    await page.goto("/posts/astro-theme");

    await expect(page).toHaveTitle(/用 Astro 构建技术博客主题/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("用 Astro 构建技术博客主题");
    await expect(page.locator(".prose").first()).toBeVisible();
    await expect(page.locator("article[data-pagefind-body]")).toHaveCount(1);
    await expect(page.locator("time[datetime]")).toHaveCount(1);

    const category = page.locator("a[href='/categories/Engineering']").first();
    await expect(category).toHaveText("Engineering");

    for (const tag of ["Astro", "Tailwind", "Theme"]) {
      await expect(page.locator(`a[href='/tags/${tag}']`).first()).toBeVisible();
    }

    await expect(page.locator("article img[src='/covers/astro-theme.svg']")).toBeVisible();
  });

  test("nested date-path post is reachable", async ({ page }) => {
    const response = await page.goto("/posts/2024/05/12/test");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("test nested");
  });

  test("headings get anchor links and the TOC mirrors h2/h3 headings", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/posts/astro-theme");

    const headingLinks = page.locator(".prose h2[id] a.heading-anchor, .prose h3[id] a.heading-anchor");
    const headingCount = await page.locator(".prose h2[id], .prose h3[id]").count();
    expect(headingCount).toBeGreaterThan(0);
    await expect(headingLinks).toHaveCount(headingCount);

    const toc = page.locator("aside nav a");
    await expect(toc).toHaveCount(headingCount);
    const firstTocHref = await toc.first().getAttribute("href");
    expect(firstTocHref).toMatch(/^#/);

    await toc.first().click();
    await expect(page).toHaveURL(/\/posts\/astro-theme#/);
    const decodedHash = await page.evaluate(() => decodeURIComponent(window.location.hash));
    expect(decodedHash).toBe(firstTocHref);
  });

  test("draft post is not reachable", async ({ page }) => {
    const response = await page.goto("/posts/draft-note");
    expect(response?.status()).toBe(404);
  });
});
