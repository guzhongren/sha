/**
 * Build-time rehype plugin: numbers external http(s) links in article
 * content with superscript markers and appends a "参考" (references) section
 * at the end of the content listing every numbered link as "link text: URL".
 * Links with no text (e.g. image links), internal/anchor/mailto links, and
 * links inside code blocks are left untouched.
 */

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function elementText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(elementText).join("");
}

function createElement(
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[],
): HastNode {
  return { type: "element", tagName, properties, children };
}

export default function rehypeLinkReferences() {
  return (tree: HastNode) => {
    const references: Array<{ text: string; href: string }> = [];
    let index = 0;

    function visit(node: HastNode) {
      if (node.type !== "element") {
        for (const child of node.children ?? []) visit(child);
        return;
      }

      if (node.tagName === "pre" || node.tagName === "code") return;

      if (node.tagName === "a") {
        const href = node.properties?.href;
        if (typeof href === "string" && EXTERNAL_URL_PATTERN.test(href)) {
          const text = elementText(node).trim();
          if (text.length > 0) {
            index += 1;
            references.push({ text, href });
            node.children?.push(
              createElement("sup", { className: ["ref-mark"] }, [{ type: "text", value: `[${index}]` }]),
            );
          }
        }
      }

      for (const child of node.children ?? []) visit(child);
    }

    visit(tree);

    if (references.length === 0) return;

    const listItems: HastNode[] = references.map(({ text, href }) =>
      createElement("li", {}, [
        { type: "text", value: `${text}: ` },
        createElement("a", { href }, [{ type: "text", value: href }]),
      ]),
    );

    tree.children?.push(
      createElement("section", { className: ["post-references"] }, [
        createElement("p", { className: ["post-references-title"] }, [{ type: "text", value: "参考" }]),
        createElement("ul", { className: ["post-references-list"] }, listItems),
      ]),
    );
  };
}
