import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import blogTheme from "@guzhongren/sha";

// GitHub Pages project sites are served under /<repo>/; local dev keeps
// root-relative URLs. The deploy workflow sets GITHUB_PAGES=true when building.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const [pagesOwner = "guzhongren", pagesRepo = "sha"] = (process.env.GITHUB_REPOSITORY || "guzhongren/sha").split("/");
// A user page repo (<owner>.github.io) is served at the domain root.
const isUserPage = pagesRepo === `${pagesOwner}.github.io`;

export default defineConfig({
  site: isGithubPages ? `https://${pagesOwner}.github.io` : "https://example.com",
  base: isGithubPages && !isUserPage ? `/${pagesRepo}/` : "/",
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
        { label: "Astro", href: "https://astro.build/", newTab: true },
        { label: "About", href: "/about" },
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
