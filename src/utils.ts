import type { CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

export function isPublished(post: Post) {
  return !post.data.draft;
}

export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => (b.data.publishDate?.getTime() ?? 0) - (a.data.publishDate?.getTime() ?? 0));
}

export function formatDate(date: Date, locale = "zh-CN") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function postHref(post: Post) {
  return withBase(`/posts/${post.id}`);
}

/**
 * Prefix a root-relative path with the configured `base` (Astro BASE_URL).
 * Leaves external URLs, protocol-relative URLs, fragments, and already-prefixed
 * paths untouched, so it is safe to apply to user-supplied links.
 */
export function withBase(path: string) {
  if (!path.startsWith("/")) return path;
  if (path.startsWith("//")) return path;
  const base = import.meta.env.BASE_URL ?? "/";
  if (base === "/" || path.startsWith(base)) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}
