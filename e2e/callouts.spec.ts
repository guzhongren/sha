import { expect, test } from "@playwright/test";

test.describe("markdown callouts", () => {
  test("renders tip, warning, and question callouts without raw markers", async ({ page }) => {
    await page.goto("/posts/2024/05/12/callouts");

    const tip = page.locator("blockquote.callout[data-callout='tip']");
    await expect(tip).toHaveCount(1);
    await expect(tip).toHaveClass(/callout-tip/);
    await expect(tip.locator("p").first()).toHaveText("💡 Tip");
    await expect(tip).toContainText("提示正文。");

    const warning = page.locator("blockquote.callout[data-callout='warning']");
    await expect(warning).toHaveCount(1);
    await expect(warning).toHaveClass(/callout-warning/);
    await expect(warning.locator("p").first()).toHaveText("⚠️ 小心踩坑");
    await expect(warning).toContainText("第一段 warning 正文。");
    await expect(warning).toContainText("第二段 warning 正文。");

    const question = page.locator("blockquote.callout[data-callout='question']");
    await expect(question).toHaveCount(1);
    await expect(question).toHaveClass(/callout-question/);
    await expect(question.locator("p").first()).toHaveText("❓ Question");
    await expect(question).toContainText("提问正文。");

    // Only the three marker blockquotes become callouts; the plain
    // blockquote keeps its normal styling.
    await expect(page.locator(".prose .callout")).toHaveCount(3);
    await expect(page.locator(".prose blockquote")).toHaveCount(4);
    const plain = page.locator(".prose blockquote:not(.callout)");
    await expect(plain).toHaveCount(1);
    await expect(plain).toContainText("这不是 callout，应该保持普通 blockquote 样式。");

    const proseText = (await page.locator(".prose").innerText()) ?? "";
    for (const marker of ["[!tip]", "[!warning]", "[!question]"]) {
      expect(proseText).not.toContain(marker);
    }
  });
});
