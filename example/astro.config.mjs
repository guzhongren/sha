import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import blogTheme from "@guzhongren/sha";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    blogTheme({
      site: {
        name: "谷中仁的博客",
        title: "谷中仁的博客",
        description: "全栈开发者的技术写作与知识沉淀",
        lang: "zh-CN",
      },
      author: {
        name: "谷中仁",
        headline: "全栈开发者 / 技术顾问",
        bio: "写工程实践、架构思考、开源与日常观察。",
        avatar: "/avatar.svg",
      },
      postsPerPage: 10,
      nav: [
        { label: "Posts", href: "/posts" },
        { label: "Tags", href: "/tags" },
        { label: "Categories", href: "/categories" },
        { label: "关于", href: "/about" },
      ],
      socialLinks: [
        { label: "GitHub", href: "https://github.com/username", icon: "github" },
        { label: "RSS", href: "/rss.xml", icon: "rss" },
      ],
      theme: {
        defaultMode: "system",
        accent: "sky",
      },
      diagrams: {
        mermaid: true,
        plantuml: {
          serverUrl: "https://www.plantuml.com/plantuml/svg",
        },
      },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
