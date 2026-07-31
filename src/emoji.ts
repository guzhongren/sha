import { nameToEmoji } from "gemoji";

export const emojiShortcodes = nameToEmoji;

export function renderEmojiShortcodes(value: string) {
  return value.replace(/:([+-]1|[a-z0-9_+-]+):/gi, (match, shortcode: string) => {
    return emojiShortcodes[shortcode.toLowerCase()] ?? match;
  });
}
