import type { BlogThemeOptions, NormalizedBlogThemeOptions } from "./types";

export function normalizeOptions(options: BlogThemeOptions): NormalizedBlogThemeOptions {
  return {
    site: {
      name: options.site.name,
      title: options.site.title ?? options.site.name,
      description: options.site.description ?? "",
      lang: options.site.lang ?? "en",
    },
    author: {
      name: options.author.name,
      headline: options.author.headline ?? "",
      bio: options.author.bio ?? "",
      avatar: options.author.avatar,
    },
    postsPerPage: options.postsPerPage ?? 8,
    nav:
      (options.nav ?? [
        { label: "Posts", href: "/posts" },
        { label: "Tags", href: "/tags" },
        { label: "Categories", href: "/categories" },
        { label: "About", href: "/about" },
      ]).map((item) => ({
        ...item,
        newTab: item.newTab ?? false,
      })),
    socialLinks: (options.socialLinks ?? []).map((link) => ({
      ...link,
      icon: link.icon ?? "link",
    })),
    theme: {
      defaultMode: options.theme?.defaultMode ?? "system",
      accent: options.theme?.accent ?? "sky",
    },
    diagrams: {
      mermaid: options.diagrams?.mermaid ?? false,
      plantuml: {
        enabled: Boolean(options.diagrams?.plantuml),
        serverUrl:
          typeof options.diagrams?.plantuml === "object"
            ? (options.diagrams.plantuml.serverUrl ?? "https://www.plantuml.com/plantuml/svg")
            : "https://www.plantuml.com/plantuml/svg",
      },
    },
    routes:
      options.routes === false
        ? {
            home: false,
            posts: false,
            tags: false,
            categories: false,
            about: false,
            search: false,
            rss: false,
          }
        : {
            home: options.routes?.home ?? true,
            posts: options.routes?.posts ?? true,
            tags: options.routes?.tags ?? true,
            categories: options.routes?.categories ?? true,
            about: options.routes?.about ?? true,
            search: options.routes?.search ?? true,
            rss: options.routes?.rss ?? true,
          },
    rss: {
      maxItems: options.rss?.maxItems ?? 10,
      followChallenge: options.rss?.followChallenge ?? null,
    },
    analytics: {
      googleAnalytics: options.analytics?.googleAnalytics?.id?.trim()
        ? {
            id: options.analytics.googleAnalytics.id.trim(),
            partytown: options.analytics.googleAnalytics.partytown ?? true,
            includeInDev: options.analytics.googleAnalytics.includeInDev ?? false,
            config: options.analytics.googleAnalytics.config ?? {},
          }
        : null,
    },
  };
}
