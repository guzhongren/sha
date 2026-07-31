# Code Style Guidelines

## General Principles

- Keep the project an Astro integration package, not a copied starter site.
- Prefer Astro, TypeScript, CSS, and small inline browser scripts.
- Avoid introducing client frameworks for theme behavior.
- Keep public configuration in `BlogThemeOptions`.
- Keep defaults in `normalizeOptions`.
- Keep user-facing behavior verified through `example/`.

## TypeScript

- Define public API shape in `src/types.ts`.
- Keep normalized/internal config types explicit.
- Use simple functions over class-based abstractions.
- Avoid broad `any`; use Astro and local types when available.
- Keep integration setup in `src/index.ts` small and readable.
- When adding option fields, update both `BlogThemeOptions` and `NormalizedBlogThemeOptions`.
- When adding option defaults, update `normalizeOptions`.

## Astro Components

- Use `.astro` components for layout, routes, and presentational UI.
- Keep components static unless browser behavior is required.
- Put shared page chrome in `BaseLayout.astro`.
- Use `virtual:blog-theme/config` for theme config inside package files.
- Prefer semantic HTML: `header`, `main`, `article`, `section`, `aside`, `nav`, `footer`.
- Keep route data loading inside page files with `getCollection` and `getStaticPaths`.
- Filter drafts with `isPublished` before rendering lists or static paths.

## Client JavaScript

- Client scripts should progressively enhance already-rendered HTML.
- Keep scripts scoped to a single concern.
- Prefer dynamic imports for heavier optional features.
- Avoid global state beyond root theme attributes and `localStorage`.
- Guard DOM mutations so components do not double-wrap elements.
- Keep error behavior non-fatal for optional enhancements like diagrams.

## Content Collections

- Keep collection definitions in `src/content.ts`.
- Validate post frontmatter with `z` schemas.
- Preserve the consumer bridge:

```ts
export { collections } from "@your-scope/astro-blog-theme/content";
```

- Add sample posts when new schema behavior needs demonstration.
- Do not make optional content fields required unless the public API change is intentional.

## CSS And Visual Style

- Keep global tokens and prose rules in `src/styles/global.css`.
- Keep component-specific layout mostly in utility classes.
- Use CSS variables for page, panel, border, text, and accent colors.
- Preserve light and dark mode parity.
- Use fine structure: rules, gutters, panels, monospace labels, and code styling.
- Avoid decorative blobs, oversized marketing hero sections, and heavy card stacks.
- Use cards only for meaningful surfaces; article lists should remain index-like.
- Keep article prose readable and restrained. Body headings should not have extra decorative marks above them.
- Use stable dimensions for repeated UI elements such as toggles, tags, covers, and code buttons.
- Confirm mobile layouts do not overflow.

## Routes

- Inject new default routes from `src/index.ts`.
- Place route implementations under `src/pages`.
- Add a route switch to the `routes` option when a page should be configurable.
- Keep route paths stable unless the public API change is explicit.
- Use `postHref(post)` for post links.

## Naming

- Use clear component names: `PostCard`, `PostList`, `ProfileIntro`, `TableOfContents`.
- Use config option names that match consumer mental models.
- Use CSS utility names for reusable visual primitives: `line-b`, `section-frame`, `surface-block`.
- Avoid clever labels in UI copy; use direct, scannable text.

## Documentation

- Update `README.md` for user-facing setup changes.
- Update `docs/architecture.md` for architecture, route, API, or data-flow changes.
- Update `docs/testing.md` for verification workflow changes.
- Update this file when coding conventions change.
- Keep `AGENTS.md` short and link to deeper docs.

## Commits

- Keep commits focused.
- Run example validation before committing.
- If committing from an automated agent, use the repository's requested `git commit --no-verify` workflow only when the user asked for it.

