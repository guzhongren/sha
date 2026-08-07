import type { APIRequestContext } from "@playwright/test";
import { nameToEmoji } from "gemoji";

/**
 * Mirrors `postsPerPage` in example/astro.config.mjs. If that config value
 * changes, update this constant to keep pagination assertions valid.
 */
export const POSTS_PER_PAGE = 10;

/** Title of the draft fixture post (example/src/content/posts/draft-note.mdx). */
export const DRAFT_TITLE = "这是一篇草稿";

/** Mirrors `followChallenge` in example/astro.config.mjs. */
export const FOLLOW_CHALLENGE_FEED_ID = "74621993392456704";
export const FOLLOW_CHALLENGE_USER_ID = "74619979585483776";

export interface FeedPost {
  title: string;
  link: string;
  pubDate: string;
}

/** Routes that must return 200 and render as HTML. */
export const HTML_ROUTES = [
  "/",
  "/posts",
  "/posts/astro-theme",
  "/posts/2024/05/12/test",
  "/posts/2024/05/12/emoji",
  "/posts/2024/05/12/echarts",
  "/posts/no-cover",
  "/tags",
  "/tags/Astro",
  "/tags/Layout",
  "/tags/Tailwind",
  "/tags/Theme",
  "/tags/Writing",
  "/categories",
  "/categories/Engineering",
  "/categories/Design",
  "/about",
  "/search",
] as const;

/** Static assets and non-HTML endpoints that must exist after a build. */
export const ASSET_ROUTES = [
  "/rss.xml",
  "/pagefind/pagefind.js",
  "/~partytown/partytown.js",
  "/avatar.svg",
  "/covers/astro-theme.svg",
] as const;

export function decodeXmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'");
}

/**
 * Applies the same shortcode rendering the theme uses for titles, so feed
 * titles can be compared with rendered page text (e.g. "Emoji :sparkles:"
 * becomes "Emoji ✨").
 */
export function renderTitleShortcodes(value: string): string {
  return value.replace(/:([+-]1|[a-z0-9_+-]+):/gi, (match, shortcode: string) => {
    return nameToEmoji[shortcode.toLowerCase()] ?? match;
  });
}

/**
 * Reads the published post list from /rss.xml. The feed is the source of
 * truth for "what should be public", so assertions stay valid as fixture
 * content grows or shrinks.
 */
export async function fetchFeedPosts(request: APIRequestContext): Promise<FeedPost[]> {
  const response = await request.get("/rss.xml");
  if (!response.ok()) {
    throw new Error(`rss.xml returned ${response.status()}`);
  }
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const content = match[1];
    const pick = (tag: string) => content.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`))?.[1] ?? "";
    return {
      title: decodeXmlEntities(pick("title")),
      link: decodeXmlEntities(pick("link")),
      pubDate: decodeXmlEntities(pick("pubDate")),
    };
  });
  return items;
}

/** Asserts a route responds with the given status code. */
export async function expectStatus(request: APIRequestContext, path: string, status: number) {
  const response = await request.get(path);
  if (response.status() !== status) {
    throw new Error(`Expected ${path} to return ${status}, got ${response.status()}`);
  }
}
