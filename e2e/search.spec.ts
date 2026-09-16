import { expect, test } from "@playwright/test";
import { DRAFT_TITLE, fetchFeedPosts } from "./helpers";

/** Matches the result URL whether or not the built route keeps a trailing slash. */
function urlPatternFor(href: string): RegExp {
  const path = href.replace(/\/+$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${path}/?$`);
}

test.describe("search page", () => {
  test("renders input, status, and static fallback with all published posts", async ({ page, request }) => {
    const feed = await fetchFeedPosts(request);
    await page.goto("/search");

    await expect(page.getByRole("heading", { name: "Search posts" })).toBeVisible();
    const root = page.locator("[data-search-mode='page']");
    const input = root.locator("[data-search-input]");
    await expect(input).toBeVisible();
    await expect(root.locator("[data-search-status]")).toHaveText("Type at least 2 characters to search.");

    const fallback = root.locator("[data-search-fallback]");
    await expect(fallback).toBeVisible();
    await expect(fallback.locator(".post-item")).toHaveCount(feed.length);
    await expect(fallback).not.toContainText(DRAFT_TITLE);
  });

  test("returns pagefind results for a matching query without drafts", async ({ page }) => {
    await page.goto("/search");

    const root = page.locator("[data-search-mode='page']");
    await root.locator("[data-search-input]").fill("Astro");
    await expect(root.locator("[data-search-status]")).toHaveText(/result/, { timeout: 30_000 });

    const results = root.locator("[data-search-result]");
    await expect(results.first()).toBeVisible();
    const hrefs = await results.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/posts\//);
    }
    await expect(root.locator("[data-search-results]")).not.toContainText(DRAFT_TITLE);
    await expect(root.locator("[data-search-fallback]")).toBeHidden();
  });

  test("shows no results for draft-only terms", async ({ page }) => {
    await page.goto("/search");
    const root = page.locator("[data-search-mode='page']");
    await root.locator("[data-search-input]").fill("草稿");
    await expect(root.locator("[data-search-status]")).toHaveText("No matching posts found.", { timeout: 30_000 });
    await expect(root.locator("[data-search-results]")).toHaveCount(1);
    await expect(root.locator("[data-search-results] li")).toHaveCount(0);
  });

  test("navigates results with arrow keys and opens the highlighted post on Enter", async ({ page }) => {
    await page.goto("/search");

    const root = page.locator("[data-search-mode='page']");
    const input = root.locator("[data-search-input]");
    const results = root.locator("[data-search-result]");
    await input.fill("Astro");
    await expect(results.first()).toBeVisible({ timeout: 30_000 });

    // The first result is highlighted as soon as results render.
    await expect(results.first()).toHaveClass(/is-active/);

    await page.keyboard.press("ArrowDown");
    await expect(results.nth(1)).toHaveClass(/is-active/);
    await expect(results.first()).not.toHaveClass(/is-active/);
    await expect(input).toBeFocused();

    const href = await results.nth(1).getAttribute("href");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(urlPatternFor(href!));
  });

  test("wraps arrow key navigation at both ends", async ({ page }) => {
    await page.goto("/search");

    const root = page.locator("[data-search-mode='page']");
    const input = root.locator("[data-search-input]");
    const results = root.locator("[data-search-result]");
    await input.fill("Astro");
    await expect(results.first()).toBeVisible({ timeout: 30_000 });
    expect(await results.count()).toBeGreaterThan(1);

    await page.keyboard.press("ArrowUp");
    await expect(results.last()).toHaveClass(/is-active/);
    await page.keyboard.press("ArrowDown");
    await expect(results.first()).toHaveClass(/is-active/);
  });

  test("keeps focus in the search box so typing continues after arrow keys", async ({ page }) => {
    await page.goto("/search");

    const root = page.locator("[data-search-mode='page']");
    const input = root.locator("[data-search-input]");
    await input.fill("Astro");
    await expect(root.locator("[data-search-result]").first()).toBeVisible({ timeout: 30_000 });

    await page.keyboard.press("ArrowDown");
    await page.keyboard.type("x");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("Astrox");
  });

  test("does not navigate on Enter when there are no results", async ({ page }) => {
    await page.goto("/search");

    const root = page.locator("[data-search-mode='page']");
    await root.locator("[data-search-input]").fill("zzzzqqqq");
    await expect(root.locator("[data-search-status]")).toHaveText("No matching posts found.", { timeout: 30_000 });

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\/?$/);
  });
});

test.describe("global search dialog", () => {
  test("opens via header trigger, closes via Esc or close button", async ({ page }) => {
    await page.goto("/");

    const dialog = page.locator("[data-search-dialog]");
    await expect(dialog).not.toHaveAttribute("open", "");

    const trigger = page.locator("nav.header-nav [data-search-trigger]");
    await trigger.click();
    await expect(dialog).toHaveAttribute("open", "");
    await expect(page.locator("[data-search-dialog] [data-search-input]")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toHaveAttribute("open", "");

    await trigger.click();
    await expect(dialog).toHaveAttribute("open", "");
    await page.locator("[data-search-close]").click();
    await expect(dialog).not.toHaveAttribute("open", "");
  });

  test("opens with Cmd/Ctrl+K and closes on backdrop click", async ({ page }) => {
    await page.goto("/");

    const dialog = page.locator("[data-search-dialog]");
    await page.keyboard.press("Control+K");
    await expect(dialog).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");

    await page.keyboard.press("Meta+K");
    await expect(dialog).toHaveAttribute("open", "");

    // Click the dialog backdrop in the top-left corner of the viewport; the
    // click target becomes the dialog element itself, closing it.
    await page.mouse.click(4, 4);
    await expect(dialog).not.toHaveAttribute("open", "");
  });

  test("searching from the dialog navigates to a post and closes it", async ({ page }) => {
    await page.goto("/");

    await page.locator("nav.header-nav [data-search-trigger]").click();
    await page.locator("[data-search-dialog] [data-search-input]").fill("Astro");

    const result = page.locator("[data-search-dialog] [data-search-result]").first();
    await expect(result).toBeVisible({ timeout: 30_000 });
    await result.click();

    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.locator("[data-search-dialog]")).not.toHaveAttribute("open", "");
  });

  test("navigates results with arrow keys, Tab, and Enter inside the dialog", async ({ page }) => {
    await page.goto("/");

    const dialog = page.locator("[data-search-dialog]");
    const input = dialog.locator("[data-search-input]");
    const results = dialog.locator("[data-search-result]");

    await page.keyboard.press("Meta+K");
    await expect(dialog).toHaveAttribute("open", "");
    await input.fill("Astro");
    await expect(results.first()).toBeVisible({ timeout: 30_000 });

    await expect(results.first()).toHaveClass(/is-active/);
    await expect(input).toHaveAttribute("aria-activedescendant", await results.first().getAttribute("id"));

    await page.keyboard.press("ArrowDown");
    await expect(results.nth(1)).toHaveClass(/is-active/);
    await expect(results.first()).not.toHaveClass(/is-active/);

    // Tab hands focus to the highlighted result instead of the first one.
    await page.keyboard.press("Tab");
    await expect(results.nth(1)).toBeFocused();

    await input.click();
    await page.keyboard.press("ArrowDown");
    await expect(results.nth(2)).toHaveClass(/is-active/);

    const href = await results.nth(2).getAttribute("href");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(urlPatternFor(href!));
    await expect(dialog).not.toHaveAttribute("open", "");
  });
});
