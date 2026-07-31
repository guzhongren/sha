declare module "virtual:blog-theme/config" {
  import type { NormalizedBlogThemeOptions } from "./types";

  const config: NormalizedBlogThemeOptions;
  export { config };
  export default config;
}

declare module "astro:content" {
  export function getCollection(
    collection: string,
    filter?: (entry: any) => boolean
  ): Promise<any[]>;

  export function defineCollection(config: {
    loader?: any;
    schema?: any;
  }): any;

  export type CollectionEntry<T extends string> = {
    id: string;
    slug: string;
    data: Record<string, any>;
    body: string;
    collection: T;
  };
}
