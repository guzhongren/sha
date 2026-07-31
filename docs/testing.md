# Testing And Verification

## Test Target

The `example/` app is the primary verification target. It consumes the package through the same public integration and content bridge expected from downstream users.

Run commands from the repository root unless noted otherwise.

## Required Checks

Run these before committing changes:

```sh
ASTRO_TELEMETRY_DISABLED=1 ./node_modules/.bin/astro sync --root example
ASTRO_TELEMETRY_DISABLED=1 ./node_modules/.bin/astro check --root example
ASTRO_TELEMETRY_DISABLED=1 ./node_modules/.bin/astro build --root example
```

For small style-only changes, `check` and `build` are usually sufficient, but `sync` should be run after content schema, route, or integration changes.

## Package Scripts

`package.json` also provides convenience scripts:

```sh
pnpm dev
pnpm sync
pnpm check
pnpm build
```

These scripts run inside `example/` with `cd example && astro ...`.

## Manual Smoke Tests

After a successful build, inspect generated pages under `example/dist`.

Recommended route coverage:

```sh
find example/dist -maxdepth 3 -name index.html | sort
```

Expected public route families:

- `/`
- `/posts`
- `/posts/astro-theme`
- `/posts/2024/05/12/test` when nested date-path fixtures are present.
- `/tags`
- `/tags/Astro`
- `/categories`
- `/categories/Engineering`
- `/about`
- `/search`

Draft posts should not generate public pages and should not appear in indexes.

For search builds, also confirm the generated Pagefind bundle exists:

```sh
test -f example/dist/pagefind/pagefind.js
```

## Feature-Specific Checks

### Integration And Config

When changing `src/index.ts`, `src/config.ts`, or `src/types.ts`:

- Confirm `example/astro.config.mjs` can still import the package.
- Confirm all enabled routes are generated.
- Confirm `routes: false` behavior if route injection logic changes.
- Confirm `virtual:blog-theme/config` consumers still compile.

### Content Schema

When changing `src/content.ts`:

- Run `astro sync --root example`.
- Confirm existing example posts still validate.
- Add or update sample frontmatter when introducing required fields.
- Confirm drafts remain filtered by all public routes.

### Pages

When changing `src/pages`:

- Run `astro build --root example`.
- Confirm affected static paths are generated.
- Confirm category/tag dynamic routes use only published posts.
- Confirm post detail pages render content, tags, optional cover, and TOC.

### Client Enhancers

When changing `CodeCopyEnhancer.astro`:

- Confirm code blocks inside `.prose` get one copy button.
- Confirm repeated navigation or hydration does not double-wrap blocks.
- Confirm the button copies plain code text.

When changing `DiagramEnhancer.astro`:

- Confirm Mermaid blocks render when `diagrams.mermaid` is true.
- Confirm PlantUML blocks render when `diagrams.plantuml` is enabled.
- Confirm plaintext blocks starting with `@startuml` are supported.
- Confirm disabled diagram options leave code blocks untouched.

When changing `EChartsEnhancer.astro` or shortcode preprocessing:

- Confirm `{{< echarts >}}...{{< /echarts >}}` renders as an ECharts container, not raw shortcode text.
- Confirm `blogTheme(...)` remains before `mdx()` in `example/astro.config.mjs`.
- Confirm invalid chart JSON shows the non-fatal error caption.
- Confirm normal code copy behavior does not wrap generated ECharts containers.

When changing `SearchEnhancer.astro` or search route behavior:

- Confirm Header Search opens the dialog.
- Confirm `Cmd+K` and `Ctrl+K` open the dialog.
- Confirm Escape closes the dialog.
- Confirm `/search` renders an inline search input and static fallback list.
- Confirm `example/dist/pagefind/pagefind.js` is generated after build.
- Confirm post detail pages contain `data-pagefind-body`.
- Confirm listing/search/category/tag pages are not marked as Pagefind bodies.
- Confirm draft content does not appear in generated public pages or search results.

### Theme And Styling

When changing `src/styles/global.css` or class-heavy components:

- Check light, dark, and system modes.
- Check mobile, tablet, and desktop widths.
- Confirm header remains fixed and content is not hidden under it.
- Confirm text does not overflow buttons, cards, or tags.
- Confirm prose headings are plain and readable.
- Confirm code blocks scroll horizontally instead of breaking layout.
- Confirm search dialog and search page results do not overflow on mobile.

## Known Warnings

These warnings are currently accepted when the build succeeds:

- Shiki does not know the `plantuml` language and can fall back to plaintext.
- Mermaid may create large client chunks because it is imported for client-side rendering.

Do not ignore new errors or warnings unrelated to these known items.

## Dependency Installation

The project uses `pnpm@9.14.0`. If dependencies are missing:

```sh
pnpm install
```

Do not switch package managers unless the repository is intentionally migrated.
