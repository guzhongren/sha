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
      site: {
        name: "My Blog",
        title: "My Blog",
        description: "A blog powered by @guzhongren/sha",
        lang: "en",
      },
      author: {
        name: "Author",
      },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
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
