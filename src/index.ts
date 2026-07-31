import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import * as pagefind from "pagefind";
import { unified } from "@astrojs/markdown-remark";
import { normalizeOptions } from "./config";
import { remarkEmojiShortcodes } from "./emoji";
import { transformContentShortcodes } from "./shortcodes";
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
    name: "@your-scope/astro-blog-theme",
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig }) => {
        updateConfig({
          markdown: {
            processor: unified({ remarkPlugins: [remarkEmojiShortcodes] }),
          },
          vite: {
            plugins: [contentShortcodePlugin(), virtualConfigPlugin(config)],
          },
        });

        if (config.routes.home) injectRoute({ pattern: "/", entrypoint: route("./pages/index.astro") });
        if (config.routes.posts) injectRoute({ pattern: "/posts", entrypoint: route("./pages/posts/index.astro") });
        if (config.routes.posts) {
          injectRoute({ pattern: "/posts/[...slug]", entrypoint: route("./pages/posts/[...slug].astro") });
        }
        if (config.routes.tags) injectRoute({ pattern: "/tags", entrypoint: route("./pages/tags/index.astro") });
        if (config.routes.tags) injectRoute({ pattern: "/tags/[tag]", entrypoint: route("./pages/tags/[tag].astro") });
        if (config.routes.categories) {
          injectRoute({ pattern: "/categories", entrypoint: route("./pages/categories/index.astro") });
          injectRoute({ pattern: "/categories/[category]", entrypoint: route("./pages/categories/[category].astro") });
        }
        if (config.routes.about) injectRoute({ pattern: "/about", entrypoint: route("./pages/about.astro") });
        if (config.routes.search) injectRoute({ pattern: "/search", entrypoint: route("./pages/search.astro") });
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
