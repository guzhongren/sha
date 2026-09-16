import { expect, test, type Locator } from "@playwright/test";

interface Gutter {
  content: string;
  display: string;
  userSelect: string;
  /** Horizontal space the gutter takes before the first code character. */
  offset: number;
}

/**
 * Reads the generated line-number box. Chromium reports `content` as the
 * literal `counter(line)`, so the gutter is asserted through its computed
 * content plus the space it reserves in front of the code text.
 */
async function readGutter(line: Locator): Promise<Gutter> {
  return line.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    const target = element.firstElementChild ?? element;
    const range = document.createRange();
    range.selectNodeContents(target);

    return {
      content: style.content,
      display: style.display,
      userSelect: style.userSelect || style.getPropertyValue("-webkit-user-select"),
      offset: range.getBoundingClientRect().left - element.getBoundingClientRect().left,
    };
  });
}

test.describe("code line numbers", () => {
  test("numbers every line of a multi-line block, including blank lines", async ({ page }) => {
    await page.goto("/posts/astro-theme");

    await expect(page.locator("html")).toHaveAttribute("data-code-line-numbers", "on");

    const lines = page.locator(".code-copy-frame pre code .line");
    await expect(lines.first()).toBeVisible();
    expect(await lines.count()).toBeGreaterThan(1);

    const first = await readGutter(lines.first());
    expect(first.content).toBe("counter(line)");
    expect(first.display).toBe("inline-block");
    expect(first.userSelect).toBe("none");
    // 2ch box plus the 0.75rem gap is roughly 28px at the theme's code size.
    expect(first.offset).toBeGreaterThanOrEqual(20);

    const gutters = await lines.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element, "::before").content),
    );
    expect(gutters).toEqual(Array.from({ length: gutters.length }, () => "counter(line)"));

    // Blank lines keep the numbering aligned with an editor's line numbers.
    const blankLines = await lines.evaluateAll((elements) =>
      elements.flatMap((element, index) => (element.textContent === "" ? [index] : [])),
    );
    expect(blankLines.length).toBeGreaterThan(0);
    expect(gutters[blankLines[0]]).toBe("counter(line)");
  });

  test("skips single-line snippets", async ({ page }) => {
    await page.goto("/posts/2024/05/12/links");

    const block = page.locator('.prose pre[data-language="md"]');
    await expect(block).toHaveCount(1);

    const lines = block.locator("code .line");
    await expect(lines).toHaveCount(1);

    const gutter = await readGutter(lines.first());
    expect(gutter.content).toBe("none");
    expect(Math.abs(gutter.offset)).toBeLessThanOrEqual(1);
  });

  test("the code.lineNumbers hook turns numbering off", async ({ page }) => {
    await page.goto("/posts/astro-theme");

    const line = page.locator(".code-copy-frame pre code .line").first();
    expect((await readGutter(line)).content).toBe("counter(line)");

    // blogTheme({ code: { lineNumbers: false } }) renders the same attribute.
    await page.evaluate(() => {
      document.documentElement.dataset.codeLineNumbers = "off";
    });

    const off = await readGutter(line);
    expect(off.content).toBe("none");
    expect(Math.abs(off.offset)).toBeLessThanOrEqual(1);
  });
});
