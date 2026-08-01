import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as getMDXRenderer } from "@astrojs/mdx/container-renderer";
import config from "virtual:blog-theme/config";
import { isPublished, sortPosts, postHref } from "../utils";

const KEEP_AS_IS_URL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function absolutizeHtmlUrls(html: string, baseUrl: URL) {
  return html.replace(/\b(src|href)=(["'])(.*?)\2/gi, (match, attr: string, quote: string, value: string) => {
    if (KEEP_AS_IS_URL_RE.test(value.trim())) return match;
    return `${attr}=${quote}${new URL(value, baseUrl).href}${quote}`;
  });
}

export async function GET(context: { site: URL }) {
  const posts = sortPosts((await getCollection("posts")).filter(isPublished)).slice(0, config.rss.maxItems);

  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const link = new URL(postHref(post), context.site);
      const content = await container.renderToString(Content);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishDate ?? new Date(),
        link: postHref(post),
        content: absolutizeHtmlUrls(content, link),
      };
    }),
  );

  return rss({
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    title: config.site.title,
    description: config.site.description,
    site: context.site,
    items,
    customData: `<language>${config.site.lang}</language>`,
  });
}
