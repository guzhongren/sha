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
3. Registers `@astrojs/sitemap` when `seo.sitemap` is enabled (default `true`).
4. Registers `@astrojs/partytown` with `forward: ["dataLayer.push"]` when `analytics.googleAnalytics.partytown` is enabled.
5. Injects enabled routes with Astro `injectRoute`.
6. Configures the markdown processor with `remark-gemoji` and the link-references rehype plugin when `linkReferences` is enabled (default `true`).

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
- `nav`: primary navigation labels and hrefs, with an optional `newTab` flag to open a link in a new browser tab.
- `socialLinks`: social links rendered as icon-only buttons, given as a record where each key is an icon value and each value is the profile URL (e.g. `{ github: "https://github.com/username" }`). `rss` also accepts `true`, which resolves to the theme's `/rss.xml` route when the RSS route is enabled. `wechat` takes the path to a WeChat QR code image; hovering the icon shows it in a popup (`SocialLink.astro`). Icons map to Iconify sets (simple-icons / ph) and cover the top 20 global social platforms plus `github`, `x`, `rss`, `mail`, and `link`; the accessible name (`aria-label` / `title`) is derived from the icon via `SOCIAL_LABELS`.
- `theme`: `system`, `light`, or `dark` default mode plus accent token. The accent (`sky`, `teal`, `violet`, `pink`) is emitted as `<html data-accent>` and drives both the `--accent` property and the class-name map in `src/accent.ts`.
- `diagrams`: Mermaid and PlantUML rendering toggles.
- `imageViewer`: opens post content images in a full-screen viewer dialog with zoom and pan; `true` by default.
- `linkReferences`: numbers external `http(s)` links in post content with superscripts and appends a "参考" section listing each link; `true` by default.
- `code`: `lineNumbers` (default `true`) renders per-line numbers in code blocks. `BaseLayout` exposes the resolved state as `<html data-code-line-numbers="on|off">`.
- `routes`: individual route switches or `false` to disable all injected pages.
- `analytics`: optional GA4 measurement. `googleAnalytics.id` enables the standard gtag.js snippet in the shared layout; `partytown` (default `true`) offloads it to a Web Worker through the auto-registered Partytown integration; `includeInDev` controls dev loading; `config` is passed through to `gtag('config', ...)`.
- `seo`: `sitemap` (default `true`) generates `sitemap-index.xml` and `sitemap-0.xml` through the auto-registered `@astrojs/sitemap` integration.

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
- `/posts` -> all published posts, paginated with clickable page numbers and a page-jump input.
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
- `Pagination.astro`: previous/next links, windowed page-number links, and a progressive page-jump input for the posts archive.
- `TagList.astro`: tag pill links.
- `TableOfContents.astro`: sticky desktop TOC for `h2` and `h3`.
- `ThemeToggle.astro`: pure toggle button markup; `BaseLayout` owns theme state and wiring.
- `CodeCopyEnhancer.astro`: adds copy buttons to prose code blocks.
- `SearchEnhancer.astro`: global search dialog, `Ctrl/Cmd+K` shortcut, Pagefind queries, and custom result rendering.
- `ImageViewerEnhancer.astro`: full-screen dialog viewer for post content images with zoom and pan.
- `DiagramEnhancer.astro`: renders Mermaid and PlantUML code fences when enabled.

## Client Enhancements

Client JavaScript is intentionally small and progressive.

Theme initialization and switching run inline in `BaseLayout.astro` before page rendering to avoid a visible theme flash and to make every toggle click respond immediately. `system` is the initial default; the first click resolves it to the opposite of the OS appearance, then a delegated document listener toggles only between `light` and `dark`, persists the selected mode to `localStorage`, updates the root class/data attributes, and reflects the active mode on the toggle buttons.

`CodeCopyEnhancer.astro` scans `.prose pre > code`, wraps each block in a frame, inserts a `Copy` button, writes code text to the Clipboard API, and briefly changes the label to `Copied`.

`SearchEnhancer.astro` provides a native `<dialog>` search modal and upgrades the `/search` page. It lazy-loads `/pagefind/pagefind.js`, debounces queries, renders a custom result template with highlighted titles and Pagefind excerpts, and falls back to the static post list when the search bundle is unavailable. Results are keyboard navigable in both roots: the first result is highlighted as soon as results render, `↑`/`↓` move the highlight (wrapping at both ends) while focus stays in the search box, `Tab` hands focus to the highlighted result, and `Enter` opens it. The input is exposed as an ARIA combobox driving a listbox of `option` results.

`ImageViewerEnhancer.astro` wraps eligible `.prose` images (excluding covers, diagram figures, and linked images) in a button that opens a native `<dialog>` viewer. The image starts fitted to the viewport; wheel and pinch gestures zoom anchored at the cursor, double-click toggles between fit and 2.5×, arrow keys and drag/touch gestures pan in all four directions, and Esc or the close button resets and closes the viewer.

`DiagramEnhancer.astro` reads the serialized diagram config from a JSON script tag. Mermaid blocks are rendered client-side with dynamic import from `mermaid`, with the page font stack injected through `fontFamily` and `themeVariables.fontFamily` because Mermaid writes its own `<style>` into the generated SVG. PlantUML blocks are encoded with `plantuml-encoder` and replaced with a lazy-loaded image; an `IntersectionObserver` then fetches the same URL as SVG, sanitizes it (scripts and `on*`/`javascript:` attributes removed) and inlines it with a `font-family` rule so labels use the theme font, falling back to the image and `data-diagram-font="server"` when the server returns a raster image or blocks CORS. Plaintext Shiki fallback is supported by detecting blocks whose text starts with `@startuml`.

`Pagination.astro` renders the previous/next links, a windowed list of page-number links (collapsed with ellipsis when there are many pages), and a `Go to page` input. The jump input is a progressive enhancement: it stays hidden until a small bundled script unhides it and turns submits into client-side navigation to the clamped page URL, so static hosting works without a form handler.

`EChartsEnhancer.astro` initializes chart containers generated from `{{< echarts >}}...{{< /echarts >}}` shortcode blocks. Canvas text cannot inherit CSS, so the enhancer merges the container's resolved font stack into `textStyle` (author options win) and records it as `data-chart-font`. `src/shortcodes.ts` converts those blocks before MDX parsing, so consumer apps must register `blogTheme(...)` before `mdx()` in `astro.config.mjs`.

## Search Indexing

When `routes.search` is enabled, the integration runs Pagefind in `astro:build:done`. It indexes the static output directory with `rootSelector: "[data-pagefind-body]"` and writes the search bundle to `/pagefind`.

Only post detail articles include `data-pagefind-body`. Listing pages, tag/category pages, the home page, and the search page are intentionally excluded from the index.

## Styling System

`src/styles/global.css` is the single styling entry point. It imports Tailwind CSS v4, declares explicit `@source` paths for theme and example files, and is organized in the three layers described in `design.md`:

1. **Tokens** — `@theme` declares only the font stacks (`--font-sans`, `--font-mono`). Colors, spacing and radii come from the built-in Tailwind palette, so markup uses stock utilities such as `bg-white dark:bg-gray-950`, `text-gray-500 dark:text-gray-400` or `border-gray-950/[0.08]` instead of project color variables. `@layer base` additionally holds a single `@font-face` for the self-hosted site font: `src/assets/fonts/MapleMono-CN-Subset-Regular.woff2` is the GB2312 subset of Maple Mono NF CN v8.002, it leads both font stacks so prose and code share one face, and it is regenerable with `scripts/build-font-subset.py`, with its OFL 1.1 text shipped alongside at `src/assets/fonts/MapleMono-LICENSE.txt`.
2. **Component classes** — `@layer components` holds the semantic classes that say *what* a thing is: `.page-canvas`, `.page-gutter`, `.line-*`, `.rule-fade`, `.rule-dashed`, `.section-frame`, `.surface-block`, `.gutter-stripes`, `.utility-note`, `.eyebrow`, `.btn` (+ `.btn-sm`, `.btn-round`, `.btn-plain`, `.btn-page`), `.pill` (+ `.pill-md`), `.search-trigger`, `.toc-link`, `.post-item`, `.avatar-mark`, `.profile-mark`, `.prose` and its callout/table/pre/reference rules, `.diagram*`, `.echarts-*`, `.code-copy-*`, `.search-*` and `.image-viewer-*`. Each class is built from stock utilities with `@apply`; hand-written declarations are limited to what utilities cannot express (pseudo elements, gradients, masks, backdrop filters, `box-shadow` and long geometry values).
3. **Utility tweaks** — templates add stock utilities for one-off layout and spacing, e.g. `<article class="post-item group line-b px-3 py-8 sm:px-4">`.

Because the components layer is declared before Tailwind's utilities layer, utilities always win over component classes, and no rule is left unlayered (an unlayered rule would outrank every Tailwind layer).

Dark mode is class driven: `@custom-variant dark (&:where(.dark, .dark *))` binds every `dark:` utility to the `.dark` class that `BaseLayout` toggles and `localStorage` persists. `color-scheme` follows the same class through `scheme-light-dark dark:scheme-dark` on `<html>`.

### Accent

`--accent` is the only custom color property. `BaseLayout` writes `<html data-accent="sky|teal|violet|pink">`, `global.css` maps each value to a Tailwind palette token (with a different companion token in dark mode), and CSS-only decoration reads `var(--accent)`: focus rings, the body gradient and dot grid, `.section-frame` corner ticks, `.post-item::before`, profile glow, blockquote rules and the search backdrop.

Everything markup can color uses `src/accent.ts` instead. `ACCENT_CLASSES` maps each `AccentColor` to complete class-name strings (`text`, `hoverText`, `groupHoverText`, `border`, `hoverBorder`, `focusBorder`, `softBg`), and components read them through `accentClasses(config.theme.accent)`. Class names are always whole literals, so Tailwind can see them and no dynamic concatenation is needed.

Client scripts drive component state with `data-*` attributes (`data-active` on search results, `data-grabbing` on the image viewer stage, `data-depth` on table-of-contents links) instead of `is-*` classes.

### Code blocks

Astro's Shiki highlighter already wraps every line in `<span class="line">`, so `.prose pre code` only resets a `line` CSS counter and `.prose pre .line::before` renders the number. The gutter is presentation-only: pseudo-element content is not part of `textContent`, so the copy button (`CodeCopyEnhancer`), the text layer, and the Pagefind index stay numbers-free, while `user-select: none` keeps manual selection clean. Blocks whose code element holds a single line skip the gutter via `:only-child`, and `[data-code-line-numbers="off"]` (emitted by `BaseLayout` from `code.lineNumbers`) disables numbering globally. Gutter color derives from `currentColor`, so it follows whatever Shiki theme is configured.

The current design intent is a refined technical writing blog, not a marketing homepage. Decoration should come from structure: gutters, rules, panels, code blocks, and content hierarchy.

## Example App

`example/` is a consumer app configured like a real site:

- `example/astro.config.mjs` imports Tailwind Vite plugin, `blogTheme`, and MDX. `blogTheme` is registered before `mdx()` so content shortcodes are preprocessed before MDX parsing.
- `example/src/content.config.ts` re-exports theme collections.
- `example/src/content/posts` contains published, featured, no-cover, diagram, ECharts, emoji, callout, and draft examples.
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
- Image viewer for post content images with zoom and pan.
- Link references: numbered external links with a "参考" section at the end of posts.
- Callouts: `[!tip]`, `[!warning]`, and `[!question]` blockquote markers render as styled panels with type-specific accents.

Known limits:

- No RSS implementation yet, despite example social link pointing at `/rss.xml`.
- No CMS.
- No multi-author model.
- No component override system.
- No packaged build output yet; exports point at source files.
