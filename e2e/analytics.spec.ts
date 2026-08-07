import { expect, test } from "@playwright/test";

test.describe("google analytics", () => {
  const PLACEHOLDER_ID = "G-XXXXXXXXXX";

  for (const path of ["/", "/posts/astro-theme"]) {
    test(`${path} renders the standard gtag snippet in partytown mode`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      const html = await page.content();
      expect(html).toContain(`https://www.googletagmanager.com/gtag/js?id=${PLACEHOLDER_ID}`);
      expect(html).toContain('type="text/partytown"');
      expect(html).toContain("window.dataLayer = window.dataLayer || [];");
      expect(html).toContain("function gtag(){dataLayer.push(arguments);}");
      expect(html).toContain(`gtag('config', "${PLACEHOLDER_ID}")`);
    });
  }
});
