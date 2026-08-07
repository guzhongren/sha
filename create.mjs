#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm dlx @guzhongren/sha <project-dir>");
  console.error("       node create.mjs <project-dir>");
  process.exit(1);
}

const root = join(process.cwd(), name);

// Dir tree
mkdirSync(join(root, "src", "content", "posts"), { recursive: true });

// package.json
writeFileSync(
  join(root, "package.json"),
  JSON.stringify(
    {
      name: name,
      version: "0.0.1",
      type: "module",
      private: true,
      scripts: {
        dev: "astro dev",
        sync: "astro sync",
        build: "astro build",
        preview: "astro preview",
      },
      dependencies: {
        "@iconify-json/ph": "^1.2.2",
        "@iconify-json/simple-icons": "^1.2.92",
        "@astrojs/markdown-remark": "^7.0.0",
        "@astrojs/mdx": "^7.0.5",
        "@guzhongren/sha": "^0.1.1",
        "@tailwindcss/vite": "^4.3.3",
        astro: "^7.1.6",
        tailwindcss: "^4.3.3",
      },
    },
    null,
    2,
  ) + "\n",
);

// astro.config.mjs
writeFileSync(
  join(root, "astro.config.mjs"),
  `import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import blogTheme from "@guzhongren/sha";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    blogTheme({
      // Site identity
      site: {
        name: "My Blog",
        title: "My Blog",
        description: "A blog powered by @guzhongren/sha",
        lang: "en",
      },

      // Author profile
      author: {
        name: "Author",
        headline: "Your headline",
        bio: "A short bio shown on the profile card.",
        avatar: "/avatar.svg",
      },

      // Number of posts shown on list pages. Defaults to 8.
      postsPerPage: 8,

      // Primary navigation. Use newTab: true for external links.
      nav: [
        { label: "Posts", href: "/posts" },
        { label: "Tags", href: "/tags" },
        { label: "Categories", href: "/categories" },
        { label: "About", href: "/about" },
      ],

      // Social links render as icon-only buttons.
      // Supported icons: github, x, rss, mail, link.
      socialLinks: [
        { label: "GitHub", href: "https://github.com/username", icon: "github" },
        { label: "RSS", href: "/rss.xml", icon: "rss" },
      ],

      // Theme mode and accent color. Accents: sky, teal, violet, pink.
      theme: {
        defaultMode: "system",
        accent: "sky",
      },

      // Diagram rendering (optional).
      diagrams: {
        mermaid: false,
        // plantuml: { serverUrl: "https://www.plantuml.com/plantuml/svg" },
        plantuml: false,
      },

      // Route switches. Set routes: false to disable all injected pages.
      routes: {
        home: true,
        posts: true,
        tags: true,
        categories: true,
        about: true,
        search: true,
        rss: true,
      },

      // RSS feed options.
      rss: {
        maxItems: 10,
        // RSSHubHub follow verification (optional). Renders a
        // <follow_challenge> element in the feed channel.
        // followChallenge: {
        //   feedId: "your-feed-id",
        //   userId: "your-user-id",
        // },
      },

      // Google Analytics 4 (optional). partytown: true (default) runs the
      // gtag.js snippet in a Web Worker via @astrojs/partytown.
      // analytics: {
      //   googleAnalytics: {
      //     id: "G-XXXXXXXXXX",
      //     partytown: true,
      //   },
      // },

      // SEO. sitemap: true (default) generates sitemap-index.xml and
      // sitemap-0.xml with @astrojs/sitemap. Requires the `site` option.
      // seo: {
      //   sitemap: true,
      // },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
`,
);

// public/avatar.svg (placeholder referenced by author.avatar)
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(
  join(root, "public", "avatar.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Avatar">
  <rect width="96" height="96" rx="48" fill="#111827"/>
  <circle cx="48" cy="25" r="10" fill="none" stroke="#94a3b8" stroke-width="4"/>
  <path d="M48 35v34M48 44 28 56M48 44l20 12M48 69 31 86M48 69l17 17" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
</svg>
`,
);

// src/content.config.ts
writeFileSync(
  join(root, "src", "content.config.ts"),
  `export { collections } from "@guzhongren/sha/content";\n`,
);

// hello-world post
writeFileSync(
  join(root, "src", "content", "posts", "hello-world.md"),
  `---
title: "Hello World"
description: "My first blog post"
publishDate: ${new Date().toISOString().slice(0, 10)}
category: "Uncategorized"
tags: ["hello"]
---

Welcome to my blog! 🎉
`,
);

// tsconfig.json
writeFileSync(
  join(root, "tsconfig.json"),
  `{
  "extends": "astro/tsconfigs/strict"
}
`,
);

// .gitignore
writeFileSync(join(root, ".gitignore"), "node_modules/\n.astro/\ndist/\n");

// pnpm-workspace.yaml (minimumReleaseAgeExclude for fresh packages)
writeFileSync(
  join(root, "pnpm-workspace.yaml"),
  `allowBuilds:
  esbuild: true
minimumReleaseAgeExclude:
  - "@guzhongren/sha"
`,
);

// Install deps
console.log(`\n✓ Scaffolded "${name}"`);
console.log("Installing dependencies...\n");
execSync("pnpm install", { cwd: root, stdio: "inherit" });

console.log(`\n✓ Done! Start the dev server:\n`);
console.log(`  cd ${name} && pnpm dev\n`);
