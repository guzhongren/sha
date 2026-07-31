export const emojiShortcodes: Record<string, string> = {
  "+1": "👍",
  "-1": "👎",
  art: "🎨",
  book: "📖",
  books: "📚",
  boom: "💥",
  bug: "🐛",
  bulb: "💡",
  calendar: "📅",
  checkered_flag: "🏁",
  clap: "👏",
  construction: "🚧",
  dart: "🎯",
  eyes: "👀",
  fire: "🔥",
  gear: "⚙️",
  heart: "❤️",
  joy: "😂",
  link: "🔗",
  lock: "🔒",
  mag: "🔍",
  memo: "📝",
  package: "📦",
  rocket: "🚀",
  smile: "😄",
  sparkles: "✨",
  star: "⭐",
  tada: "🎉",
  thinking: "🤔",
  unlock: "🔓",
  warning: "⚠️",
  wave: "👋",
  white_check_mark: "✅",
  x: "❌",
  zap: "⚡",
};

type MdastNode = {
  type?: string;
  value?: string;
  children?: MdastNode[];
};

export function renderEmojiShortcodes(value: string) {
  return value.replace(/:([+-]1|[a-z0-9_+-]+):/gi, (match, shortcode: string) => {
    return emojiShortcodes[shortcode.toLowerCase()] ?? match;
  });
}

export function remarkEmojiShortcodes() {
  return (tree: MdastNode) => {
    visitTextNodes(tree);
  };
}

function visitTextNodes(node: MdastNode) {
  if (node.type === "text" && typeof node.value === "string") {
    node.value = renderEmojiShortcodes(node.value);
    return;
  }

  if (node.type === "code" || node.type === "inlineCode" || node.type === "html") return;

  for (const child of node.children ?? []) {
    visitTextNodes(child);
  }
}
