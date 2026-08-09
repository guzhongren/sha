import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import icon from "astro-icon";
import { unified } from "@astrojs/markdown-remark";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import * as pagefind from "pagefind";
import remarkGemoji from "remark-gemoji";
import { normalizeOptions } from "./config";
import rehypeLinkReferences from "./rehype-link-references";
import { transformContentShortcodes } from "./shortcodes";
import { SIMPLE_ICONS_INCLUDE } from "./socialIcons";
import type { BlogThemeOptions } from "./types";

function virtualConfigPlugin(config: unknown) {
  const moduleId = "virtual:blog-theme/config";
  const resolvedModuleId = `\0${moduleId}`;

  return {
    name: "astro-blog-theme-config",
    resolveId(id: string) {
      if (id === moduleId) return resolvedModuleId;
    },
    load(id: string) {
      if (id === resolvedModuleId) {
        return `export const config = ${JSON.stringify(config)}; export default config;`;
      }
    },
  };
}

function virtualAboutPlugin() {
  const moduleId = "virtual:blog-theme/about-content";
  const resolvedModuleId = `\0${moduleId}`;
  let root = "";

  return {
    name: "astro-blog-theme-about",
    configResolved(config: any) {
      root = config.root;
    },
    resolveId(id: string) {
      if (id === moduleId) return resolvedModuleId;
    },
    load(id: string) {
      if (id !== resolvedModuleId) return;
      const md = resolve(root, "src/content/about.md");
      const mdx = resolve(root, "src/content/about.mdx");
      const aboutPath = existsSync(md) ? md : existsSync(mdx) ? mdx : null;
      if (aboutPath) {
        return `export { Content } from ${JSON.stringify(aboutPath)}`;
      }
      return `export const Content = null`;
    },
  };
}

function contentShortcodePlugin() {
  return {
    name: "astro-blog-theme-content-shortcodes",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!/\.(md|mdx)(?:[?#].*)?$/.test(id) || !code.includes("{{<")) return;
      return {
        code: transformContentShortcodes(code),
        map: null,
      };
    },
  };
}

function route(path: string) {
  return fileURLToPath(new URL(path, import.meta.url));
}

export default function blogTheme(options: BlogThemeOptions): AstroIntegration {
  const config = normalizeOptions(options);

  return {
    name: "@guzhongren/sha",
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig }) => {
        const integrations: AstroIntegration[] = [
          icon({
            include: {
              "simple-icons": SIMPLE_ICONS_INCLUDE,
              ph: ["envelope-simple-fill", "link-simple-fill", "list"],
            },
          }),
        ];

        if (config.seo.sitemap) {
          integrations.push(sitemap());
        }

        if (config.analytics.googleAnalytics?.partytown) {
          integrations.push(partytown({ config: { forward: ["dataLayer.push"] } }));
        }

        updateConfig({
          markdown: {
            processor: unified({
              remarkPlugins: [remarkGemoji],
              rehypePlugins: config.linkReferences ? [rehypeLinkReferences] : [],
            }),
          },
          vite: {
            plugins: [contentShortcodePlugin(), virtualConfigPlugin(config), virtualAboutPlugin()],
          },
          integrations,
        });

        if (config.routes.home) injectRoute({ pattern: "/", entrypoint: route("./pages/index.astro") });
        if (config.routes.posts) injectRoute({ pattern: "/posts", entrypoint: route("./pages/posts/index.astro") });
        if (config.routes.posts) {
          injectRoute({ pattern: "/posts/[...slug]", entrypoint: route("./pages/posts/[...slug].astro") });
          injectRoute({ pattern: "/posts/page/[page]", entrypoint: route("./pages/posts/page/[page].astro") });
        }
        if (config.routes.tags) injectRoute({ pattern: "/tags/[tag]", entrypoint: route("./pages/tags/[tag].astro") });
        if (config.routes.tags) injectRoute({ pattern: "/tags", entrypoint: route("./pages/tags/index.astro") });
        if (config.routes.categories) {
          injectRoute({ pattern: "/categories/[category]", entrypoint: route("./pages/categories/[category].astro") });
          injectRoute({ pattern: "/categories", entrypoint: route("./pages/categories/index.astro") });
        }
        if (config.routes.about) injectRoute({ pattern: "/about", entrypoint: route("./pages/about.astro") });
        if (config.routes.search) injectRoute({ pattern: "/search", entrypoint: route("./pages/search.astro") });
        if (config.routes.rss) injectRoute({ pattern: "/rss.xml", entrypoint: route("./pages/rss.xml.ts") });
      },
      "astro:build:done": async ({ dir }) => {
        if (!config.routes.search) return;

        const sitePath = fileURLToPath(dir);
        const outputPath = fileURLToPath(new URL("./pagefind", dir));
        const { index, errors: createErrors } = await pagefind.createIndex({
          rootSelector: "[data-pagefind-body]",
          includeCharacters: "_-:/#.",
        });

        if (!index || createErrors.length > 0) {
          throw new Error(`Pagefind index creation failed: ${createErrors.join("; ") || "unknown error"}`);
        }

        try {
          const addResult = await index.addDirectory({ path: sitePath });
          if (addResult.errors.length > 0) {
            throw new Error(addResult.errors.join("; "));
          }

          const writeResult = await index.writeFiles({ outputPath });
          if (writeResult.errors.length > 0) {
            throw new Error(writeResult.errors.join("; "));
          }
        } finally {
          await pagefind.close();
        }
      },
    },
  };
}

export type { BlogThemeOptions } from "./types";
