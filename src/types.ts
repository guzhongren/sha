export type ThemeMode = "system" | "light" | "dark";
export type AccentColor = "sky" | "teal" | "violet" | "pink";
export type SocialIcon =
  | "github"
  | "x"
  | "rss"
  | "mail"
  | "link"
  | "facebook"
  | "youtube"
  | "instagram"
  | "whatsapp"
  | "tiktok"
  | "wechat"
  | "telegram"
  | "messenger"
  | "snapchat"
  | "reddit"
  | "kuaishou"
  | "weibo"
  | "qq"
  | "pinterest"
  | "linkedin"
  | "quora"
  | "discord"
  | "tumblr"
  | "threads";

export type BlogThemeOptions = {
  site: {
    name: string;
    title?: string;
    description?: string;
    lang?: string;
  };
  author: {
    name: string;
    headline?: string;
    bio?: string;
    avatar?: string;
  };
  nav?: Array<{
    label: string;
    href: string;
    /** Open the link in a new browser tab. Defaults to `false` (same tab). */
    newTab?: boolean;
  }>;
  /**
   * Social links rendered as icon-only buttons. Keys are `SocialIcon` values
   * and values are the profile URLs, for example
   * `{ github: "https://github.com/username", rss: true }`. `rss` accepts
   * `true` as shorthand for the theme's `/rss.xml` route.
   */
  socialLinks?: {
    [K in SocialIcon]?: K extends "rss" ? string | true : string;
  };
  postsPerPage?: number;
  theme?: {
    defaultMode?: ThemeMode;
    accent?: AccentColor;
  };
  diagrams?: {
    mermaid?: boolean;
    plantuml?:
      | boolean
      | {
          serverUrl?: string;
        };
  };
  /**
   * Open images inside post content in a full-screen viewer dialog with
   * zoom and pan. Defaults to `true`.
   */
  imageViewer?: boolean;
  /**
   * Number external http(s) links in post content with superscripts and
   * list them in a "参考" (references) section at the end of the article.
   * Defaults to `true`.
   */
  linkReferences?: boolean;
  routes?:
    | false
    | {
        home?: boolean;
        posts?: boolean;
        tags?: boolean;
        categories?: boolean;
        about?: boolean;
        search?: boolean;
        rss?: boolean;
      };
  rss?: {
    /** Number of most recent posts included in the RSS feed. Defaults to 10. */
    maxItems?: number;
    /** RSSHubHub follow verification. Renders a `<follow_challenge>` element in the feed channel. */
    followChallenge?: {
      feedId: string;
      userId: string;
    };
  };
  analytics?: {
    googleAnalytics?: {
      /** GA4 measurement ID, e.g. `"G-XXXXXXXXXX"`. */
      id: string;
      /**
       * Run the gtag.js snippet in a Partytown web worker instead of the main
       * thread. When enabled, the theme registers `@astrojs/partytown` and
       * forwards `dataLayer.push`. Defaults to `true`.
       */
      partytown?: boolean;
      /**
       * Load the snippet during `astro dev` too. Defaults to `false`
       * (production builds only).
       */
      includeInDev?: boolean;
      /** Extra options passed to `gtag('config', id, config)`, e.g. `{ debug_mode: true }`. */
      config?: Record<string, unknown>;
    };
  };
  seo?: {
    /**
     * Generate `sitemap-index.xml` and `sitemap-0.xml` with
     * `@astrojs/sitemap` on every build. Defaults to `true` and requires
     * the `site` option in `astro.config.mjs`.
     */
    sitemap?: boolean;
  };
};

export type NormalizedBlogThemeOptions = {
  site: {
    name: string;
    title: string;
    description: string;
    lang: string;
  };
  author: {
    name: string;
    headline: string;
    bio: string;
    avatar?: string;
  };
  nav: Array<{
    label: string;
    href: string;
    newTab: boolean;
  }>;
  socialLinks: Array<{
    label: string;
    href: string;
    icon: SocialIcon;
  }>;
  postsPerPage: number;
  theme: {
    defaultMode: ThemeMode;
    accent: AccentColor;
  };
  diagrams: {
    mermaid: boolean;
    plantuml: {
      enabled: boolean;
      serverUrl: string;
    };
  };
  imageViewer: boolean;
  linkReferences: boolean;
  routes: {
    home: boolean;
    posts: boolean;
    tags: boolean;
    categories: boolean;
    about: boolean;
    search: boolean;
    rss: boolean;
  };
  rss: {
    maxItems: number;
    followChallenge: { feedId: string; userId: string } | null;
  };
  analytics: {
    googleAnalytics: {
      id: string;
      partytown: boolean;
      includeInDev: boolean;
      config: Record<string, unknown>;
    } | null;
  };
  seo: {
    sitemap: boolean;
  };
};
