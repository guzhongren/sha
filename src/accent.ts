import type { AccentColor } from "./types";

/**
 * Accent utilities as complete class-name strings.
 *
 * Tailwind scans this file for literals, and `blogTheme` only ever composes
 * whole strings, so accent colors never rely on dynamic class-name
 * concatenation (`bg-${accent}-500`). CSS that cannot be driven by class
 * names (pseudo elements, gradients, masks, focus rings) reads the matching
 * `--accent` property declared in `src/styles/global.css`.
 */
export interface AccentClasses {
  /** Accent text color. */
  text: string;
  /** Accent text color on hover. */
  hoverText: string;
  /** Accent text color when an ancestor with `group` is hovered. */
  groupHoverText: string;
  /** Accent border color. */
  border: string;
  /** Accent border color on hover. */
  hoverBorder: string;
  /** Accent border color on focus. */
  focusBorder: string;
  /** Translucent accent fill for selected surfaces. */
  softBg: string;
}

export const ACCENT_CLASSES: Record<AccentColor, AccentClasses> = {
  sky: {
    text: "text-sky-500 dark:text-sky-400",
    hoverText: "hover:text-sky-500 dark:hover:text-sky-400",
    groupHoverText: "group-hover:text-sky-500 dark:group-hover:text-sky-400",
    border: "border-sky-500 dark:border-sky-400",
    hoverBorder: "hover:border-sky-500 dark:hover:border-sky-400",
    focusBorder: "focus:border-sky-500 dark:focus:border-sky-400",
    softBg: "bg-sky-500/[0.14] dark:bg-sky-400/[0.14]",
  },
  teal: {
    text: "text-teal-500 dark:text-teal-400",
    hoverText: "hover:text-teal-500 dark:hover:text-teal-400",
    groupHoverText: "group-hover:text-teal-500 dark:group-hover:text-teal-400",
    border: "border-teal-500 dark:border-teal-400",
    hoverBorder: "hover:border-teal-500 dark:hover:border-teal-400",
    focusBorder: "focus:border-teal-500 dark:focus:border-teal-400",
    softBg: "bg-teal-500/[0.14] dark:bg-teal-400/[0.14]",
  },
  violet: {
    text: "text-violet-500 dark:text-violet-400",
    hoverText: "hover:text-violet-500 dark:hover:text-violet-400",
    groupHoverText: "group-hover:text-violet-500 dark:group-hover:text-violet-400",
    border: "border-violet-500 dark:border-violet-400",
    hoverBorder: "hover:border-violet-500 dark:hover:border-violet-400",
    focusBorder: "focus:border-violet-500 dark:focus:border-violet-400",
    softBg: "bg-violet-500/[0.14] dark:bg-violet-400/[0.14]",
  },
  pink: {
    text: "text-pink-500 dark:text-pink-400",
    hoverText: "hover:text-pink-500 dark:hover:text-pink-400",
    groupHoverText: "group-hover:text-pink-500 dark:group-hover:text-pink-400",
    border: "border-pink-500 dark:border-pink-400",
    hoverBorder: "hover:border-pink-500 dark:hover:border-pink-400",
    focusBorder: "focus:border-pink-500 dark:focus:border-pink-400",
    softBg: "bg-pink-500/[0.14] dark:bg-pink-400/[0.14]",
  },
};

/** Accent class map for a normalized theme config value. */
export function accentClasses(accent: AccentColor): AccentClasses {
  return ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.sky;
}
