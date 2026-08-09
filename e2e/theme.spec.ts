import { expect, test } from "@playwright/test";

test.describe("theme", () => {
  test("defaults to system and respects prefers-color-scheme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-default-theme", "system");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("toggle switches only between light and dark and persists", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html");
    // Desktop header toggle; the mobile header renders a second toggle.
    const toggle = page.locator("nav.header-nav [data-theme-toggle]");

    await expect(html).toHaveAttribute("data-theme", "system");

    // OS is light, so the first click leaves system and goes to dark.
    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(html).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  });

  test("stored preference survives reload", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("every toggle click gives visible feedback even when system matches the OS", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const html = page.locator("html");
    const toggle = page.locator("nav.header-nav [data-theme-toggle]");
    const icon = async () => (await toggle.textContent())!.trim();

    // Starts in system, which looks identical to dark on a dark OS, but the
    // first click leaves system and the icon flips, so it is never a no-op.
    await expect(html).toHaveAttribute("data-theme", "system");
    expect(await icon()).toBe("◐");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await icon()).toBe("☀");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await icon()).toBe("☾");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await icon()).toBe("☀");
  });

  test("light and dark modes use different computed backgrounds", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.reload();
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.reload();
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

    expect(light).not.toBe(dark);
  });
});
