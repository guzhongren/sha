# Architecture

## Overview

This project is a config-driven Astro blog theme package. Consumers install the package, register the default `blogTheme(options)` integration in `astro.config.mjs`, and expose the package content collections through a small `src/content.config.ts` bridge.

The theme injects routes, provides layouts/components/styles, and passes user configuration into theme files through a Vite virtual module. The example app under `example/` is the integration fixture and should remain the primary build target for verification.

## Package Surface

`package.json` exposes three public entries:

- `@guzhongren/sha` -> `src/index.ts`
- `@guzhongren/sha/content` -> `src/content.ts`
- `@guzhongren/sha/styles.css` -> `src/styles/global.css`

The package is currently private and uses source-file exports rather than a compiled distribution.

## Integration Flow

`src/index.ts` exports the default `blogTheme(options)` Astro integration.

At setup time it:

1. Normalizes user options with `normalizeOptions` from `src/config.ts`.
2. Adds a Vite plugin that exposes `virtual:blog-theme/config`.
3. Injects enabled routes with Astro `injectRoute`.

The virtual config plugin serializes normalized options into an ESM module:

```ts
import config from "virtual:blog-theme/config";
```

Theme components and pages use that import instead of reading app files directly. This keeps user configuration centralized in `astro.config.mjs`.

## Configuration Model

Public options are defined in `src/types.ts`.

Major option groups:

- `site`: name, title, description, language.
- `author`: name, headline, bio, optional avatar.
- `nav`: primary navigation labels and hrefs.
- `socialLinks`: simple social links with optional icon identifiers.
- `theme`: `system`, `light`, or `dark` default mode plus accent token.
- `diagrams`: Mermaid and PlantUML rendering toggles.
- `routes`: individual route switches or `false` to disable all injected pages.

`src/config.ts` applies defaults for optional fields, default navigation, theme mode, diagram configuration, and route switches.

## Content Model

`src/content.ts` exports Astro content collections:

```ts
export const collections = { posts };
```

Consumers bridge it from their app:

```ts
export { collections } from "@guzhongren/sha/content";
```

Posts are loaded from `./src/content/posts/**/*.{md,mdx}` in the consuming app and validated with this schema:

- `title: string`
- `description: string`
- `publishDate: Date`
- `updatedDate?: Date`
- `category: string`
- `tags: string[]`
- `cover?: string`
- `draft: boolean`
- `featured: boolean`

`src/utils.ts` provides shared helpers for filtering drafts, sorting by publish date, formatting dates, unique sorting, and generating post URLs.

## Injected Routes

Routes are injected from `src/pages`:

- `/` -> latest posts with a compact author intro.
- `/posts` -> all published posts.
- `/posts/[...slug]` -> article page with metadata, tags, optional cover, prose content, and table of contents. This rest route supports direct post files and nested date paths such as `/posts/2024/05/12/my-post`.
- `/tags` -> tag index.
- `/tags/[tag]` -> posts for one tag.
- `/categories` -> category index.
- `/categories/[category]` -> posts for one category.
- `/about` -> author/site intro page.
- `/search` -> Pagefind full-text search page with static article-list fallback.

Every list route filters drafts with `isPublished`. Dynamic tag/category/post routes generate static paths from published posts only.

## Layout And Components

`src/layouts/BaseLayout.astro` is the shared shell. It imports global CSS, renders the fixed header and footer, sets SEO title/description basics, initializes the theme before paint, and mounts client enhancers.

Core components:

- `Header.astro`: fixed top navigation, search trigger, social links, theme toggle.
- `Footer.astro`: copyright and nav links.
- `ProfileIntro.astro`: config-driven author/profile intro block.
- `PostCard.astro`: list item and featured-post rendering.
- `PostList.astro`: simple post collection renderer.
- `TagList.astro`: tag pill links.
- `TableOfContents.astro`: sticky desktop TOC for `h2` and `h3`.
- `ThemeToggle.astro`: small inline script cycling `system`, `light`, `dark`.
- `CodeCopyEnhancer.astro`: adds copy buttons to prose code blocks.
- `SearchEnhancer.astro`: global search dialog, `Ctrl/Cmd+K` shortcut, Pagefind queries, and custom result rendering.
- `DiagramEnhancer.astro`: renders Mermaid and PlantUML code fences when enabled.

## Client Enhancements

Client JavaScript is intentionally small and progressive.

Theme initialization runs inline in `BaseLayout.astro` before page rendering to avoid a visible theme flash. `ThemeToggle.astro` writes the selected mode to `localStorage` and updates the root class/data attributes.

`CodeCopyEnhancer.astro` scans `.prose pre > code`, wraps each block in a frame, inserts a `Copy` button, writes code text to the Clipboard API, and briefly changes the label to `Copied`.

`SearchEnhancer.astro` provides a native `<dialog>` search modal and upgrades the `/search` page. It lazy-loads `/pagefind/pagefind.js`, debounces queries, renders a custom result template with highlighted titles and Pagefind excerpts, and falls back to the static post list when the search bundle is unavailable.

`DiagramEnhancer.astro` reads the serialized diagram config from a JSON script tag. Mermaid blocks are rendered client-side with dynamic import from `mermaid`. PlantUML blocks are encoded with `plantuml-encoder` and replaced with lazy-loaded images from the configured PlantUML server. Plaintext Shiki fallback is supported by detecting blocks whose text starts with `@startuml`.

`EChartsEnhancer.astro` initializes chart containers generated from `{{< echarts >}}...{{< /echarts >}}` shortcode blocks. `src/shortcodes.ts` converts those blocks before MDX parsing, so consumer apps must register `blogTheme(...)` before `mdx()` in `astro.config.mjs`.

## Search Indexing

When `routes.search` is enabled, the integration runs Pagefind in `astro:build:done`. It indexes the static output directory with `rootSelector: "[data-pagefind-body]"` and writes the search bundle to `/pagefind`.

Only post detail articles include `data-pagefind-body`. Listing pages, tag/category pages, the home page, and the search page are intentionally excluded from the index.

## Styling System

`src/styles/global.css` imports Tailwind CSS v4 and declares explicit `@source` paths for theme and example files.

The visual system is based on:

- CSS custom properties for page, panel, border, text, and accent colors.
- `.dark` root class for dark mode.
- fine-line utilities: `.line-y`, `.line-t`, `.line-b`, `.line-x`.
- structural rules: `.rule-fade`, `.rule-dashed`.
- framed surfaces: `.section-frame`, `.surface-block`.
- technical texture: `.gutter-stripes`, `.utility-note`.
- prose styling for headings, links, inline code, pre blocks, hr, blockquotes, tables, callouts, lists, and diagrams.
- chart styling for ECharts containers.

The current design intent is a refined technical writing blog, not a marketing homepage. Decoration should come from structure: gutters, rules, panels, code blocks, and content hierarchy.

## Example App

`example/` is a consumer app configured like a real site:

- `example/astro.config.mjs` imports Tailwind Vite plugin, `blogTheme`, and MDX. `blogTheme` is registered before `mdx()` so content shortcodes are preprocessed before MDX parsing.
- `example/src/content.config.ts` re-exports theme collections.
- `example/src/content/posts` contains published, featured, no-cover, diagram, ECharts, emoji, and draft examples.
- `example/public` contains sample avatar and cover assets.

Use the example app for development, verification, and documentation examples.

## Current Scope And Limits

Current scope:

- Single-author technical blog.
- Static output.
- MD/MDX posts through Astro content collections.
- Injected default routes.
- Tags, categories, draft filtering, featured posts.
- System/light/dark theme.
- Mermaid and PlantUML support.
- Copy buttons for code blocks.
- Pagefind full-text search page and global search dialog.

Known limits:

- No RSS implementation yet, despite example social link pointing at `/rss.xml`.
- No CMS.
- No multi-author model.
- No component override system.
- No packaged build output yet; exports point at source files.
