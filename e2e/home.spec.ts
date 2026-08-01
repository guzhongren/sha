import { expect, test } from "@playwright/test";
import { DRAFT_TITLE, POSTS_PER_PAGE, fetchFeedPosts, renderTitleShortcodes } from "./helpers";

test.describe("home page", () => {
  test("renders site meta and profile intro", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/谷中仁的博客/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /技术写作/,
    );

    const intro = page.locator(".section-frame");
    await expect(intro).toContainText("谷中仁的博客");
    await expect(intro).toContainText("全栈开发者 / 技术顾问");
    await expect(intro).toContainText("写工程实践、架构思考、开源与日常观察。");

    const github = page.getByRole("link", { name: "GitHub" });
    await expect(github).toHaveAttribute("href", "https://github.com/username");
    const rss = page.getByRole("link", { name: "RSS" });
    await expect(rss).toHaveAttribute("href", "/rss.xml");
  });

  test("lists published posts in feed order without drafts", async ({ page, request }) => {
    const feed = await fetchFeedPosts(request);
    expect(feed.length).toBeGreaterThan(0);

    await page.goto("/");

    await expect(page.locator(".post-item")).toHaveCount(feed.length);
    const titles = page.locator(".post-item h2 a");
    for (let index = 0; index < feed.length; index += 1) {
      await expect(titles.nth(index)).toHaveText(renderTitleShortcodes(feed[index].title));
    }
    await expect(page.locator("body")).not.toContainText(DRAFT_TITLE);
  });

  test("shows view-all link only when posts exceed postsPerPage", async ({ page, request }) => {
    const feed = await fetchFeedPosts(request);
    await page.goto("/");

    const viewAll = page.getByRole("link", { name: /View all posts/ });
    if (feed.length > POSTS_PER_PAGE) {
      await expect(viewAll).toBeVisible();
    } else {
      await expect(viewAll).toHaveCount(0);
    }
  });

  test("featured post card is rendered for the first item", async ({ page }) => {
    await page.goto("/");

    const first = page.locator(".post-item").first();
    await expect(first.locator("img")).toBeVisible();
    await expect(first.locator("a[href='/categories/Engineering']")).toHaveCount(1);
  });

  test("header and footer navigation follow the configured site nav", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav.header-nav");
    await expect(nav.getByRole("link", { name: "Posts" })).toHaveAttribute("href", "/posts");
    await expect(nav.getByRole("link", { name: "Tags" })).toHaveAttribute("href", "/tags");
    await expect(nav.getByRole("link", { name: "Categories" })).toHaveAttribute("href", "/categories");
    await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");

    const external = nav.getByRole("link", { name: "Astro" });
    await expect(external).toHaveAttribute("href", "https://astro.build/");
    await expect(external).toHaveAttribute("target", "_blank");
    await expect(external).toHaveAttribute("rel", "noopener noreferrer");

    await expect(page.locator("footer")).toContainText(`© ${new Date().getFullYear()} 谷中仁`);
    await expect(page.locator("footer").getByRole("link", { name: "About" })).toBeVisible();
  });
});
