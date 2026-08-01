import { expect, test } from "@playwright/test";
import { DRAFT_TITLE } from "./helpers";

test.describe("tags", () => {
  test("index lists every tag used by published posts", async ({ page }) => {
    await page.goto("/tags");
    await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();
    for (const tag of ["Astro", "Layout", "Tailwind", "Theme", "Writing"]) {
      await expect(page.locator(`a[href='/tags/${tag}']`)).toHaveCount(1);
    }
    await expect(page.locator("body")).not.toContainText(DRAFT_TITLE);
  });

  test("tag page lists only matching published posts", async ({ page }) => {
    await page.goto("/tags/Astro");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Astro");
    const titles = await page.locator(".post-item h2 a").allTextContents();
    expect(titles).toContain("用 Astro 构建技术博客主题");
    expect(titles).toContain("Emoji ✨");
    expect(titles).toContain("ECharts 图表渲染");
    expect(titles).toContain("test nested");
    expect(titles).not.toContain("没有封面图的文章也要好看");
    await expect(page.locator("body")).not.toContainText(DRAFT_TITLE);
  });

  test("post card tag links navigate to the tag page", async ({ page }) => {
    await page.goto("/posts/no-cover");
    await page.locator("a[href='/tags/Writing']").first().click();
    await expect(page).toHaveURL(/\/tags\/Writing$/);
    await expect(page.locator(".post-item h2 a")).toContainText(["没有封面图的文章也要好看"]);
  });
});

test.describe("categories", () => {
  test("index lists every category used by published posts", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
    for (const category of ["Design", "Engineering"]) {
      await expect(page.locator(`a[href='/categories/${category}']`)).toHaveCount(1);
    }
  });

  test("category page lists only matching published posts", async ({ page }) => {
    await page.goto("/categories/Engineering");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Engineering");
    const titles = await page.locator(".post-item h2 a").allTextContents();
    expect(titles).toContain("用 Astro 构建技术博客主题");
    expect(titles).toContain("Emoji ✨");
    expect(titles).toContain("ECharts 图表渲染");
    expect(titles).toContain("test nested");
    expect(titles).not.toContain("没有封面图的文章也要好看");
    await expect(page.locator("body")).not.toContainText(DRAFT_TITLE);
  });

  test("post card category link navigates to the category page", async ({ page }) => {
    await page.goto("/posts/no-cover");
    await page.locator("a[href='/categories/Design']").first().click();
    await expect(page).toHaveURL(/\/categories\/Design$/);
    await expect(page.locator(".post-item h2 a")).toContainText(["没有封面图的文章也要好看"]);
  });
});
