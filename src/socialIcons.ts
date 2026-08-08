import type { SocialIcon } from "./types";

/**
 * Maps every `SocialIcon` config value to its Iconify icon name. This is the
 * single source of truth for rendering (`SocialIcon.astro`) and for the
 * astro-icon bundle whitelist in the integration setup.
 */
export const SOCIAL_ICONIFY_NAMES: Record<SocialIcon, string> = {
  // Utility / meta icons.
  github: "simple-icons:github",
  x: "simple-icons:x",
  rss: "simple-icons:rss",
  mail: "ph:envelope-simple-fill",
  link: "ph:link-simple-fill",
  // Top 20 global social platforms by active users (We Are Social, 2025).
  facebook: "simple-icons:facebook",
  youtube: "simple-icons:youtube",
  instagram: "simple-icons:instagram",
  whatsapp: "simple-icons:whatsapp",
  tiktok: "simple-icons:tiktok",
  wechat: "simple-icons:wechat",
  telegram: "simple-icons:telegram",
  messenger: "simple-icons:messenger",
  snapchat: "simple-icons:snapchat",
  reddit: "simple-icons:reddit",
  kuaishou: "simple-icons:kuaishou",
  weibo: "simple-icons:sinaweibo",
  qq: "simple-icons:qq",
  pinterest: "simple-icons:pinterest",
  linkedin: "simple-icons:linkedin",
  quora: "simple-icons:quora",
  discord: "simple-icons:discord",
  tumblr: "simple-icons:tumblr",
  threads: "simple-icons:threads",
};

/** Accessible display names used for `aria-label` / `title` on social links. */
export const SOCIAL_LABELS: Record<SocialIcon, string> = {
  github: "GitHub",
  x: "X",
  rss: "RSS",
  mail: "Mail",
  link: "Link",
  facebook: "Facebook",
  youtube: "YouTube",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  wechat: "WeChat",
  telegram: "Telegram",
  messenger: "Messenger",
  snapchat: "Snapchat",
  reddit: "Reddit",
  kuaishou: "Kuaishou",
  weibo: "Weibo",
  qq: "QQ",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  quora: "Quora",
  discord: "Discord",
  tumblr: "Tumblr",
  threads: "Threads",
};

/** Bare `simple-icons` names astro-icon must bundle for social icons. */
export const SIMPLE_ICONS_INCLUDE: string[] = [
  ...new Set(
    Object.values(SOCIAL_ICONIFY_NAMES)
      .filter((name) => name.startsWith("simple-icons:"))
      .map((name) => name.slice("simple-icons:".length)),
  ),
];
