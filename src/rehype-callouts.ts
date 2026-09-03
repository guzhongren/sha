/**
 * Build-time rehype plugin: converts blockquotes that open with a
 * `[!tip]`, `[!warning]`, or `[!question]` marker into callout panels.
 * The marker line is replaced by an emoji/title header. Text that follows
 * the marker line in the same paragraph (i.e. no blank line between the
 * marker and the body) is kept as the callout body's first paragraph. The
 * blockquote is tagged with `callout callout-{type}` plus
 * `data-callout="{type}"`. Blockquotes without a marker are left untouched.
 */

const CALLOUT_TYPES = ["tip", "warning", "question"] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];

const CALLOUT_ICONS: Record<CalloutType, string> = {
  tip: "💡",
  warning: "⚠️",
  question: "❓",
};

const DEFAULT_LABELS: Record<CalloutType, string> = {
  tip: "Tip",
  warning: "Warning",
  question: "Question",
};

const CALLOUT_PATTERN = /^\s*\[!(tip|question|warning)\](?:\s+(.*?))?\s*$/i;

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function nodeText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(nodeText).join("");
}

function addClass(properties: Record<string, unknown>, className: string) {
  const current = properties.className;
  if (!current) {
    properties.className = [className];
    return;
  }
  if (Array.isArray(current)) {
    if (!current.includes(className)) current.push(className);
    return;
  }
  properties.className = [current, className];
}

/**
 * Removes the first `count` text characters from a paragraph's inline
 * children. Text nodes are split at the boundary; inline elements whose text
 * lies entirely inside the removed prefix are dropped. Returns `null` when
 * the boundary would fall inside an inline element, since that input cannot
 * be split without mangling it.
 */
function stripTextPrefix(children: HastNode[], count: number): HastNode[] | null {
  const leftover: HastNode[] = [];
  let remaining = count;

  for (const child of children) {
    if (remaining <= 0) {
      leftover.push(child);
      continue;
    }
    if (child.type === "text") {
      const value = child.value ?? "";
      if (value.length <= remaining) {
        remaining -= value.length;
        continue;
      }
      leftover.push({ ...child, value: value.slice(remaining) });
      remaining = 0;
      continue;
    }

    const length = nodeText(child).length;
    if (length <= remaining) {
      // Inline element belongs entirely to the marker line (e.g. title
      // markup); drop it with the marker.
      remaining -= length;
      continue;
    }
    return null;
  }

  return leftover;
}

function convertBlockquote(node: HastNode): boolean {
  const children = node.children ?? [];
  const markerIndex = children.findIndex(
    (child) => child.type === "element" && child.tagName === "p",
  );
  if (markerIndex === -1) return false;
  const first = children[markerIndex];

  // The marker must be the first line of the first paragraph. In Markdown,
  // body text that starts on the next blockquote line (no blank line) lives
  // in the same paragraph, so match against the first line only.
  const text = nodeText(first);
  const lineEnd = text.indexOf("\n");
  const firstLine = lineEnd === -1 ? text : text.slice(0, lineEnd);
  const match = CALLOUT_PATTERN.exec(firstLine);
  if (!match) return false;

  const type = match[1].toLowerCase() as CalloutType;
  const title = (match[2] ?? "").trim() || DEFAULT_LABELS[type];
  const icon = CALLOUT_ICONS[type];

  // Drop the marker line (plus its trailing newline when body text follows)
  // and keep the remainder as the callout body's first paragraph.
  const consumed = firstLine.length + (lineEnd === -1 ? 0 : 1);
  const leftover = stripTextPrefix(first.children ?? [], consumed);
  if (leftover === null) return false;

  const header: HastNode = {
    type: "element",
    tagName: "p",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "strong",
        properties: {},
        children: [{ type: "text", value: `${icon} ${title}` }],
      },
    ],
  };

  const replacement: HastNode[] = [header];
  if (leftover.length > 0) {
    replacement.push({
      type: "element",
      tagName: "p",
      properties: {},
      children: leftover,
    });
  }
  children.splice(markerIndex, 1, ...replacement);

  node.properties = node.properties ?? {};
  addClass(node.properties, "callout");
  addClass(node.properties, `callout-${type}`);
  node.properties.dataCallout = type;
  return true;
}

function transformChildren(node: HastNode) {
  if (!Array.isArray(node.children)) return;

  for (const child of node.children) {
    if (child.type === "element" && child.tagName === "blockquote") {
      convertBlockquote(child);
    }
    transformChildren(child);
  }
}

export default function rehypeCallouts() {
  return (tree: HastNode) => {
    transformChildren(tree);
  };
}
