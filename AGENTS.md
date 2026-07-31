# AGENTS.md

This repository is an Astro blog theme package. It is consumed as an Astro integration, not as a copied site template.

## Quick Context

- Package entry: [`src/index.ts`](src/index.ts)
- Public option types: [`src/types.ts`](src/types.ts)
- Option defaults: [`src/config.ts`](src/config.ts)
- Content collection export: [`src/content.ts`](src/content.ts)
- Shared layout: [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro)
- Global styles: [`src/styles/global.css`](src/styles/global.css)
- Example consumer app: [`example/`](example/)

## Project Docs

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Testing and verification: [`docs/testing.md`](docs/testing.md)
- Code style guidelines: [`docs/code-style-guidelines.md`](docs/code-style-guidelines.md)
- Product/design baseline: [`design.md`](design.md)
- Implementation plan: [`plan.md`](plan.md)
- Task tracker: [`tasks.md`](tasks.md)

## Working Rules

- Keep the theme config-driven through `blogTheme({...})` in `astro.config.mjs`.
- Prefer Astro components and static rendering. Do not add React/Vue/Svelte unless a task explicitly requires it.
- Keep client JavaScript small and localized to progressive enhancements.
- Preserve the package-style integration boundary: injected pages live in `src/pages`, consumer content lives in `example/src/content/posts`.
- Use the exported content bridge from `@your-scope/astro-blog-theme/content`.
- Keep styling in `src/styles/global.css` plus component utility classes.
- Follow the existing technical-blog visual system: compact prose, fine rules, restrained panels, dark/system theme, code-first details.
- Do not turn the home page into a marketing landing page.
- Filter draft posts from all public route output.
- Run validation against the example app before committing behavior or style changes.

## Common Commands

```sh
pnpm install
ASTRO_TELEMETRY_DISABLED=1 ./node_modules/.bin/astro sync --root example
ASTRO_TELEMETRY_DISABLED=1 ./node_modules/.bin/astro check --root example
ASTRO_TELEMETRY_DISABLED=1 ./node_modules/.bin/astro build --root example
```

## Known Non-Fatal Build Warnings

- Shiki falls back to plaintext for `plantuml`; runtime rendering still detects PlantUML blocks that start with `@startuml`.
- Mermaid can produce large client chunks because the renderer is bundled for client-side diagram rendering.

