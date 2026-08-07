import { expect, test } from "@playwright/test";
import {
  ASSET_ROUTES,
  DRAFT_TITLE,
  FOLLOW_CHALLENGE_FEED_ID,
  FOLLOW_CHALLENGE_USER_ID,
  HTML_ROUTES,
  expectStatus,
  fetchFeedPosts,
  renderTitleShortcodes,
} from "./helpers";

test.describe("public route inventory", () => {
  for (const path of HTML_ROUTES) {
    test(`${path} returns 200 and renders HTML`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(await response?.headerValue("content-type")).toContain("text/html");
    });
  }

  for (const path of ASSET_ROUTES) {
    test(`${path} exists after build`, async ({ request }) => {
      await expectStatus(request, path, 200);
    });
  }

  test("draft post route is not generated", async ({ request }) => {
    await expectStatus(request, "/posts/draft-note", 404);
  });
});

test.describe("rss feed", () => {
  test("is valid XML with the site title as channel title", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml.trimStart().startsWith("<?xml")).toBe(true);
    expect(xml).toContain("<rss");
    expect(xml).toContain("<channel>");
    expect(xml).toContain("<title>谷中仁的博客</title>");
  });

  test("contains only published posts", async ({ request }) => {
    const posts = await fetchFeedPosts(request);
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(renderTitleShortcodes(post.title)).not.toBe(DRAFT_TITLE);
      expect(post.link).toMatch(/\/posts\//);
    }
  });

  test("renders the configured follow challenge feedId and userId", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).toContain("<follow_challenge>");
    expect(xml).toContain(`<feedId>${FOLLOW_CHALLENGE_FEED_ID}</feedId>`);
    expect(xml).toContain(`<userId>${FOLLOW_CHALLENGE_USER_ID}</userId>`);
    expect(xml).toContain("</follow_challenge>");
  });
});
