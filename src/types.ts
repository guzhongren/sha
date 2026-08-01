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
  };
};
