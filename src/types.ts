export type ThemeMode = "system" | "light" | "dark";
export type AccentColor = "sky" | "teal" | "violet" | "pink";
export type SocialIcon = "github" | "x" | "rss" | "mail" | "link";

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
  socialLinks?: Array<{
    label: string;
    href: string;
    icon?: SocialIcon;
  }>;
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
