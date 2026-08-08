import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { SIMPLE_ICONS_INCLUDE, SOCIAL_ICONIFY_NAMES, SOCIAL_LABELS } from "../src/socialIcons";

/** The top 20 global social platforms exposed as icon values. */
const PLATFORM_KEYS = [
  "facebook",
  "youtube",
  "instagram",
  "whatsapp",
  "tiktok",
  "wechat",
  "telegram",
  "messenger",
  "snapchat",
  "reddit",
  "kuaishou",
  "weibo",
  "qq",
  "pinterest",
  "linkedin",
  "quora",
  "discord",
  "tumblr",
  "threads",
] as const;

const LEGACY_KEYS = ["github", "x", "rss", "mail", "link"] as const;

function iconifyNames(set: string): Set<string> {
  const data = JSON.parse(readFileSync(`node_modules/@iconify-json/${set}/icons.json`, "utf8"));
  return new Set(Object.keys(data.icons));
}

test.describe("social icons", () => {
  const simpleIcons = iconifyNames("simple-icons");
  const phIcons = iconifyNames("ph");

  test("every mapped icon name exists in its Iconify set", () => {
    for (const [key, name] of Object.entries(SOCIAL_ICONIFY_NAMES)) {
      const prefix = name.slice(0, name.indexOf(":"));
      const bare = name.slice(name.indexOf(":") + 1);
      const set = prefix === "simple-icons" ? simpleIcons : phIcons;
      expect(set.has(bare), `${key} maps to missing icon ${name}`).toBe(true);
    }
  });

  test("every simple-icons name is covered by the astro-icon include list", () => {
    for (const [key, name] of Object.entries(SOCIAL_ICONIFY_NAMES)) {
      if (!name.startsWith("simple-icons:")) continue;
      const bare = name.slice("simple-icons:".length);
      expect(SIMPLE_ICONS_INCLUDE, `${key} -> ${name} missing from SIMPLE_ICONS_INCLUDE`).toContain(bare);
    }
  });

  test("covers the top 20 social platforms plus the legacy icons", () => {
    for (const key of [...PLATFORM_KEYS, ...LEGACY_KEYS]) {
      expect(SOCIAL_ICONIFY_NAMES, `missing icon value ${key}`).toHaveProperty(key);
    }
  });

  test("every icon has an accessible label for aria-label / title", () => {
    for (const key of Object.keys(SOCIAL_ICONIFY_NAMES)) {
      expect(SOCIAL_LABELS[key as keyof typeof SOCIAL_LABELS], `missing label for ${key}`).toBeTruthy();
    }
  });
});
