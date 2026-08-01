import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import config from "virtual:blog-theme/config";
import { isPublished, sortPosts, postHref } from "../utils";

export async function GET(context: { site: URL }) {
  const posts = sortPosts((await getCollection("posts")).filter(isPublished));

  return rss({
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    title: config.site.title,
    description: config.site.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate ?? new Date(),
      link: postHref(post),
    })),
    customData: `<language>${config.site.lang}</language>`,
  });
}
