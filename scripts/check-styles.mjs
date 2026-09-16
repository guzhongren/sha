#!/usr/bin/env node
/**
 * Style architecture guard.
 *
 * Enforces the class-name rules documented in design.md and
 * docs/code-style-guidelines.md:
 *
 * 1. Colors come from the Tailwind palette, so templates must not read custom
 *    properties (`text-[var(--text-muted)]`).
 * 2. The legacy color properties are gone for good.
 * 3. Class names are never concatenated (`class={`btn-${variant}`}`), because
 *    Tailwind cannot see them; use a complete class-name map or `class:list`.
 * 4. Component state uses `data-*` attributes, not `is-*` classes.
 * 5. `src/styles/global.css` may only read `--accent`, `--color-*` and
 *    `--font-*` custom properties.
 *
 * Usage: node scripts/check-styles.mjs [dir]
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const target = process.argv[2] ?? "src";
const extensions = new Set([".astro", ".ts", ".css"]);

const legacyProperties = [
  "page-bg",
  "panel-bg",
  "panel-strong",
  "border-soft",
  "border-hairline",
  "text-strong",
  "text-body",
  "text-muted",
  "callout-tip",
  "callout-warning",
  "callout-question",
];

/** Custom properties `global.css` is allowed to reference. */
const allowedCssProperties = /^--(accent|color-[\w-]+|font-[\w-]+)$/;

const isStyleEntry = (file) => file.split(sep).join("/").endsWith("styles/global.css");
const isTemplate = (file) => file.endsWith(".astro") || (file.endsWith(".ts") && !isStyleEntry(file));

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return walk(path);
    return extensions.has(entry.slice(entry.lastIndexOf("."))) ? [path] : [];
  });
}

/** @type {{ file: string, line: number, message: string }[]} */
const violations = [];

function report(file, index, source, message) {
  const line = source.slice(0, index).split("\n").length;
  violations.push({ file, line, message });
}

function eachMatch(source, pattern, visit) {
  for (const match of source.matchAll(pattern)) {
    visit(match);
  }
}

for (const file of walk(target)) {
  const source = readFileSync(file, "utf8");
  const label = relative(process.cwd(), file);

  // 1 + 5. Custom properties: only `global.css`, and only the allow list.
  eachMatch(source, /var\(\s*(--[\w-]+)/g, (match) => {
    if (!isStyleEntry(file)) {
      report(file, match.index, source, `custom property \`${match[1]}\` in a template; use Tailwind palette utilities`);
      return;
    }
    if (!allowedCssProperties.test(match[1])) {
      report(file, match.index, source, `custom property \`${match[1]}\` is not allowed; use \`--accent\` or a Tailwind \`--color-*\`/\`--font-*\` token`);
    }
  });

  // 2. Removed color properties.
  eachMatch(source, new RegExp(`--(${legacyProperties.join("|")})\\b`, "g"), (match) => {
    report(file, match.index, source, `removed style property \`--${match[1]}\`; use Tailwind palette utilities`);
  });

  // 3. Dynamic class-name concatenation.
  eachMatch(source, /class(?:Name)?\s*=\s*(?:\{\s*)?`/g, (match) => {
    report(file, match.index, source, "template literal used for class names; use a complete class-name map or `class:list`");
  });

  eachMatch(source, /class(?:Name)?\s*=\s*[^`;"'\n]*\+/g, (match) => {
    report(file, match.index, source, "class name built with `+`; use a complete class-name map or `class:list`");
  });

  // 4. `is-*` state classes instead of `data-*` attributes.
  eachMatch(source, /classList\.(?:add|remove|toggle)\(\s*["'`]is-[\w-]+/g, (match) => {
    report(file, match.index, source, "`is-*` state class; use a `data-*` attribute instead");
  });

  eachMatch(source, /["'`\s]is-(?:active|open|closed|selected|grabbing|hidden)\b/g, (match) => {
    report(file, match.index, source, "`is-*` state class; use a `data-*` attribute instead");
  });
}

if (violations.length === 0) {
  console.log(`style guard: ${target} is clean`);
  process.exit(0);
}

for (const violation of violations) {
  console.error(`${violation.file}:${violation.line}: ${violation.message}`);
}
console.error(`\nstyle guard: ${violations.length} violation(s)`);
process.exit(1);
